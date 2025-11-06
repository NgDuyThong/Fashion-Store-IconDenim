const User = require('../models/User')
const jwt = require('jsonwebtoken')
const nodemailer = require('nodemailer')
const bcrypt = require('bcrypt')
const axios = require('axios')

// Số lần đăng nhập sai tối đa cho phép
const MAX_LOGIN_ATTEMPTS = 5
// Thời gian khóa mặc định (5 phút)
const DEFAULT_LOCK_TIME = 5 * 60 * 1000

// Tạo transporter để gửi email - Thử với cấu hình đơn giản
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    },
    tls: {
        ciphers: 'SSLv3'
    }
})

// Backup transporter với cấu hình khác
const backupTransporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
})

// Outlook transporter (nếu muốn thử)
const outlookTransporter = nodemailer.createTransport({
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
})

// Tạo token JWT
const generateToken = (userID) => {
    return jwt.sign({ userID }, process.env.JWT_SECRET, {
        expiresIn: '24h' // Token hết hạn sau 24 giờ
    })
}

// Đăng ký tài khoản mới
const register = async (req, res) => {
    try {
        const { fullname, email, password, phone, gender } = req.body

        // Kiểm tra email đã tồn tại
        const existingUser = await User.findOne({ email })
        if (existingUser) {
            return res.status(400).json({ message: 'Email đã được sử dụng' })
        }

        // Kiểm tra số điện thoại đã tồn tại
        const existingPhone = await User.findOne({ phone })
        if (existingPhone) {
            return res.status(400).json({ message: 'Số điện thoại đã được sử dụng' })
        }

        // Tạo user mới
        const user = await User.create({
            userID: Date.now(),
            fullname,
            email,
            password, // Không hash password ở đây vì đã có middleware pre save
            phone,
            gender,
            role: 'customer',
            lastLogin: null,
            loginAttempts: 0,
            lockUntil: null
        })

        // Tạo token
        const token = generateToken(user.userID)

        res.status(201).json({
            success: true,
            message: 'Đăng ký tài khoản thành công',
            token,
            user: {
                userID: user.userID,
                fullname: user.fullname,
                email: user.email,
                phone: user.phone,
                gender: user.gender,
                role: user.role
            }
        })

    } catch (error) {
        console.error('Lỗi đăng ký tài khoản:', error)
        res.status(500).json({
            message: 'Có lỗi xảy ra khi đăng ký tài khoản',
            error: error.message
        })
    }
}

// Đăng nhập
const login = async (req, res) => {
    try {
        const { email, password } = req.body

        // Kiểm tra email và password có được nhập không
        if (!email || !password) {
            return res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu' })
        }

        // Tìm user theo email
        const user = await User.findOne({ email })
        if (!user) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' })
        }

        // Kiểm tra tài khoản có bị vô hiệu hóa không
        if (user.isDisabled) {
            return res.status(403).json({ message: 'Tài khoản đã bị vô hiệu hóa' })
        }

        // Kiểm tra tài khoản có đang bị khóa không
        if (user.lockUntil && user.lockUntil > Date.now()) {
            const remainingTime = Math.ceil((user.lockUntil - Date.now()) / 1000 / 60)
            return res.status(403).json({
                message: `Tài khoản đang bị khóa. Vui lòng thử lại sau ${remainingTime} phút`
            })
        }

        // Kiểm tra mật khẩu
        const isMatch = await user.comparePassword(password)
        if (!isMatch) {
            // Tăng số lần đăng nhập sai
            await user.incLoginAttempts()

            // Nếu đã đạt giới hạn thử (5 lần)
            if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
                // Khóa tài khoản trong 5 phút
                await User.findOneAndUpdate(
                    { email },
                    {
                        lockUntil: Date.now() + DEFAULT_LOCK_TIME,
                        loginAttempts: MAX_LOGIN_ATTEMPTS
                    }
                )
                return res.status(403).json({
                    message: `Tài khoản đã bị khóa ${DEFAULT_LOCK_TIME / 60000} phút do đăng nhập sai ${MAX_LOGIN_ATTEMPTS} lần`
                })
            }

            return res.status(401).json({
                message: 'Email hoặc mật khẩu không đúng',
                attemptsLeft: MAX_LOGIN_ATTEMPTS - user.loginAttempts
            })
        }

        // Reset số lần đăng nhập sai và cập nhật thời gian đăng nhập
        await user.resetLoginAttempts()

        // Tạo token
        const token = generateToken(user.userID)

        res.status(200).json({
            success: true,
            message: 'Đăng nhập thành công',
            token,
            user: {
                userID: user.userID,
                fullname: user.fullname,
                email: user.email,
                phone: user.phone,
                gender: user.gender,
                role: user.role
            }
        })

    } catch (error) {
        console.error('Lỗi đăng nhập:', error)
        res.status(500).json({
            message: 'Có lỗi xảy ra khi đăng nhập',
            error: error.message
        })
    }
}

// Lưu trữ OTP tạm thởi (trong thực tế nên dùng Redis hoặc database)
const otpStore = new Map()

// Tạo và gửi OTP qua email
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body

        // Debug: Kiểm tra cấu hình email
        console.log('Email config check:', {
            hasEmailUser: !!process.env.EMAIL_USER,
            hasEmailPassword: !!process.env.EMAIL_PASSWORD,
            emailUser: process.env.EMAIL_USER,
            passwordLength: process.env.EMAIL_PASSWORD?.length
        });

        // Test transporter connection
        try {
            await transporter.verify();
            console.log('✅ Email transporter verified successfully');
        } catch (verifyError) {
            console.error('❌ Email transporter verification failed:');
            console.error('Error code:', verifyError.code);
            console.error('Error message:', verifyError.message);
            console.error('Error response:', verifyError.response);
            console.error('Full error:', verifyError);
            
            return res.status(500).json({
                message: 'Lỗi cấu hình email. Vui lòng kiểm tra lại cấu hình email.',
                error: verifyError.message,
                code: verifyError.code
            });
        }

        // Kiểm tra email có tồn tại
        const user = await User.findOne({ email })
        if (!user) {
            return res.status(404).json({ message: 'Email không tồn tại trong hệ thống' })
        }

        // Tạo OTP ngẫu nhiên 6 số
        const otp = Math.floor(100000 + Math.random() * 900000).toString()

        // Lưu OTP với thời gian hết hạn 5 phút
        otpStore.set(email, {
            otp,
            expiry: Date.now() + 5 * 60 * 1000 // 5 phút
        })

        // Gửi email chứa OTP
        const mailOptions = {
            from: {
                name: 'IconDenim',
                address: process.env.EMAIL_USER
            },
            to: email,
            subject: 'Đặt lại mật khẩu IconDenim',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td align="center" style="padding: 40px 0;">
                                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                                    <!-- Header -->
                                    <tr>
                                        <td style="padding: 40px 30px; text-align: center; background: linear-gradient(to right, #4f46e5, #7c3aed); border-radius: 8px 8px 0 0;">
                                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                                                Đặt lại mật khẩu
                                            </h1>
                                        </td>
                                    </tr>

                                    <!-- Content -->
                                    <tr>
                                        <td style="padding: 40px 30px;">
                                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.5; color: #333333;">
                                                Xin chào <strong>${user.fullname}</strong>,
                                            </p>
                                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.5; color: #333333;">
                                                Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Đây là mã xác thực của bạn:
                                            </p>
                                            
                                            <!-- OTP Box -->
                                            <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                                                <tr>
                                                    <td align="center">
                                                        <div style="background-color: #f8f9fa; border: 2px dashed #4f46e5; border-radius: 8px; padding: 20px; display: inline-block;">
                                                            <span style="font-size: 32px; font-weight: bold; color: #4f46e5; letter-spacing: 8px;">
                                                                ${otp}
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            </table>

                                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.5; color: #333333;">
                                                Mã này sẽ hết hạn sau <strong>5 phút</strong>. Vui lòng không chia sẻ mã này với bất kỳ ai.
                                            </p>
                                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.5; color: #333333;">
                                                Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này hoặc liên hệ với chúng tôi nếu bạn có thắc mắc.
                                            </p>
                                        </td>
                                    </tr>

                                    <!-- Footer -->
                                    <tr>
                                        <td style="padding: 30px; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
                                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                                <tr>
                                                    <td style="text-align: center; padding-bottom: 20px;">
                                                        <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #666666;">
                                                            Đây là email tự động, vui lòng không trả lời email này.
                                                        </p>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="text-align: center;">
                                                        <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #666666;">
                                                            &copy; 2025 IconDenim. All rights reserved.
                                                        </p>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
            `
        }

        // Tạm thời hiển thị OTP trong console để test
        console.log('🔑 OTP for testing:', otp);
        console.log('📧 Email would be sent to:', email);
        
        // Thử gửi email với transporter chính
        try {
            await transporter.sendMail(mailOptions)
            console.log('✅ Email sent successfully with primary transporter');
        } catch (sendError) {
            console.log('❌ Primary transporter failed, trying backup...');
            console.error('Primary error:', sendError.message);
            
            // Thử với backup transporter
            try {
                await backupTransporter.sendMail(mailOptions)
                console.log('✅ Email sent successfully with backup transporter');
            } catch (backupError) {
                console.error('❌ Both transporters failed:');
                console.error('Backup error:', backupError.message);
                
                // Tạm thời không throw error, chỉ log
                console.log('⚠️ Email sending failed, but OTP is available in console for testing');
            }
        }

        res.status(200).json({
            message: 'Mã OTP đã được gửi đến email của bạn',
            email: email // Trả về email để dùng cho bước tiếp theo
        })

    } catch (error) {
        console.error('Lỗi gửi mã OTP:', error)

        // Kiểm tra lỗi cụ thể từ nodemailer
        if (error.code === 'EAUTH') {
            return res.status(500).json({
                message: 'Lỗi xác thực email. Vui lòng kiểm tra lại cấu hình email.',
                error: error.message
            })
        }

        // Các lỗi khác
        res.status(500).json({
            message: 'Có lỗi xảy ra khi gửi mã OTP',
            error: error.message
        })
    }
}

// Xác thực OTP và đổi mật khẩu mới
const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body

        // Kiểm tra OTP có tồn tại và còn hạn
        const storedOTPData = otpStore.get(email)
        if (!storedOTPData) {
            return res.status(400).json({ message: 'Mã OTP không hợp lệ hoặc đã hết hạn' })
        }

        if (storedOTPData.otp !== otp) {
            return res.status(400).json({ message: 'Mã OTP không chính xác' })
        }

        if (Date.now() > storedOTPData.expiry) {
            otpStore.delete(email)
            return res.status(400).json({ message: 'Mã OTP đã hết hạn' })
        }

        // Mã OTP hợp lệ, cập nhật mật khẩu và mở khóa tài khoản
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        await User.findOneAndUpdate(
            { email },
            {
                password: hashedPassword,
                loginAttempts: 0, // Reset số lần đăng nhập sai
                lockUntil: null   // Mở khóa tài khoản
            }
        )

        // Xóa OTP đã sử dụng
        otpStore.delete(email)

        res.status(200).json({
            message: 'Đặt lại mật khẩu thành công. Tài khoản đã được mở khóa.', newPassword
        })

    } catch (error) {
        console.error('Lỗi đặt lại mật khẩu:', error)
        res.status(500).json({
            message: 'Có lỗi xảy ra khi đặt lại mật khẩu',
            error: error.message
        })
    }
}

const verifyToken = async (req, res) => {
    try {
        // Lấy token từ Authorization header
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Token không được cung cấp hoặc không đúng định dạng'
            })
        }

        // Lấy token từ header (bỏ 'Bearer ' ở đầu)
        const token = authHeader.split(' ')[1]

        // Xác thực token
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const { userID } = decoded

        // Tìm user theo userID
        const user = await User.findOne({ userID })
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            })
        }

        // Kiểm tra tài khoản có bị vô hiệu hóa không
        if (user.isDisabled) {
            return res.status(403).json({
                success: false,
                message: 'Tài khoản đã bị vô hiệu hóa'
            })
        }

        // Kiểm tra tài khoản có đang bị khóa không
        if (user.lockUntil && user.lockUntil > Date.now()) {
            const remainingTime = Math.ceil((user.lockUntil - Date.now()) / 1000 / 60)
            return res.status(403).json({
                success: false,
                message: `Tài khoản đang bị khóa. Vui lòng thử lại sau ${remainingTime} phút`
            })
        }

        // Tạo token mới nếu token cũ sắp hết hạn (ví dụ: còn 5 giây)
        const tokenExp = decoded.exp * 1000 // Chuyển sang milliseconds
        const newToken = tokenExp - Date.now() <= 5000 ? generateToken(userID) : null

        // Trả về thông tin user và token mới (nếu có)
        res.status(200).json({
            success: true,
            message: 'Token hợp lệ',
            user: {
                userID: user.userID,
                fullname: user.fullname,
                email: user.email,
                phone: user.phone,
                gender: user.gender,
                role: user.role
            },
            ...(newToken && { newToken }) // Chỉ trả về newToken nếu có
        })

    } catch (error) {
        console.error('Lỗi xác thực token:', error)

        // Xử lý các loại lỗi JWT cụ thể
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token không hợp lệ',
                error: error.message
            })
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token đã hết hạn',
                error: error.message
            })
        }

        // Các lỗi khác
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi xác thực token',
            error: error.message
        })
    }
}

// Thêm hàm xử lý đăng nhập Google
const googleLogin = async (req, res) => {
    try {
        const { access_token } = req.body
        
        if (!access_token) {
            return res.status(400).json({ 
                message: 'Access token không được cung cấp'
            })
        }

        // Lấy thông tin người dùng từ Google
        let googleUserInfo
        try {
            googleUserInfo = await axios.get(
                'https://www.googleapis.com/oauth2/v3/userinfo',
                {
                    headers: { Authorization: `Bearer ${access_token}` }
                }
            )
        } catch (error) {
            console.error('Lỗi lấy thông tin từ Google:', error)
            return res.status(401).json({
                message: 'Token Google không hợp lệ hoặc đã hết hạn',
                error: error.message
            })
        }

        const { email, name, picture } = googleUserInfo.data

        try {
            // Kiểm tra xem email đã tồn tại trong hệ thống chưa
            let user = await User.findOne({ email })

            if (!user) {
                // Nếu chưa có user, tạo mới
                const newUser = {
                    userID: Date.now(),
                    fullname: name,
                    email,
                    avatar: picture,
                    gender: 'male',
                    role: 'customer',
                    loginType: 'google',
                    password: Math.random().toString(36).slice(-8),
                    phone: null // Đặt là null
                }

                user = await User.create(newUser)
            } else {
                // Nếu user đã tồn tại nhưng đăng ký bằng local
                if (user.loginType === 'local') {
                    // Cập nhật thông tin từ Google
                    user.avatar = picture
                    user.loginType = 'google'
                    await user.save()
                }
            }

            // Kiểm tra tài khoản có bị vô hiệu hóa không
            if (user.isDisabled) {
                return res.status(403).json({ message: 'Tài khoản đã bị vô hiệu hóa' })
            }

            // Tạo token
            const token = generateToken(user.userID)

            // Reset số lần đăng nhập sai và cập nhật thời gian đăng nhập
            await user.resetLoginAttempts()

            res.status(200).json({
                success: true,
                message: 'Đăng nhập Google thành công',
                token,
                user: {
                    userID: user.userID,
                    fullname: user.fullname,
                    email: user.email,
                    avatar: user.avatar,
                    role: user.role,
                    gender: user.gender,
                    phone: user.phone
                }
            })

        } catch (error) {
            console.error('Lỗi xử lý dữ liệu user:', error)
            return res.status(500).json({
                message: 'Có lỗi xảy ra khi xử lý thông tin người dùng',
                error: error.message
            })
        }

    } catch (error) {
        console.error('Lỗi đăng nhập Google:', error)
        res.status(500).json({
            message: 'Có lỗi xảy ra khi đăng nhập với Google',
            error: error.message
        })
    }
}

module.exports = {
    register,
    login,
    forgotPassword,
    resetPassword,
    verifyToken,
    googleLogin
}
