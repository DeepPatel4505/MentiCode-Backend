import mailgen from "mailgen";
import nodemailer from "nodemailer";

const sendEmail = async function (options) {

    const mailGenerator = new mailgen({
        theme:"default",
        product:{
            name:"MentiCode",
            link:"https:menticode.com"
        }
    })

    const emailText = mailGenerator.generatePlaintext(options.mailgenContent);
    const emailHtml = mailGenerator.generate(options.mailgenContent);
    
    const transporter = nodemailer.createTransport({
        host:process.env.MAILTRAP_SMTP_HOST,
        port:process.env.MAILTRAP_SMTP_PORT,
        auth:{
            user:process.env.MAILTRAP_SMTP_USER,
            pass:process.env.MAILTRAP_SMTP_PASS,
        }
    })

    const mail = {
        from : "mail.taskmanager@example.com",
        to : options.email,
        subject : options.subject,
        text : emailText,
        html : emailHtml,
    }

    try{
        await transporter.sendMail(mail);
        console.log("Mail is sent")
    }
    catch(e){
        console.error("Email service failed");
        console.error("Error : ",e);
    }
}

const emailVerificationMailgenContent = (username,verificationUrl) => {
    return {
        body : {
            name:username,
            intro:"Welocome to our website! We are excited to have you on-board",
            action:{
                instructions:"To verify your email click on following button/link",
                button:{
                    color:"#11a0f3",
                    text: "Verify your email",
                    link: verificationUrl
                }
            },
            outro:"Need our help?, Kindly revert back on this email we would love to help you."
        }
    }
}

const forgotPasswordMailgenContent = (username,passwordResetUrl) =>{

    return {
        body:{
            name:username,
            intro:"We have received a request to reset the password for your account.",
            action:{
                instructions:"To change your password click on following button/link",
                button:{
                    color:"#11a0f3",
                    text: "Change your password",
                    link: passwordResetUrl
                }
            },
            outro:"Need our help?, Kindly revert back on this email we would love to help you."
        }
    }
}



export {    
            emailVerificationMailgenContent,
            forgotPasswordMailgenContent,
            sendEmail
        } 