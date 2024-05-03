const MongoDB = require("./mongodb.service");
const { mongoConfig,tokenSecret } = require("../config");
const nodemailer = require('nodemailer');
const config = require("../config");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { query } = require("express");
const { use } = require("../routes");

const userRegister = async (user)=>{
    try{
        if(!user?.username || !user?.email || !user?.password)
        return{status:false,message:"Please fill up all the fields"};
        const passwordHash = await bcrypt.hash(user?.password,10)
        let userObject = {
            username: user?.username,
            email: user?.email,
            password:passwordHash,
        };
        let savedUser = await MongoDB.db
        .collection(mongoConfig.collection.USERS)
        .insertOne(userObject);
        if(savedUser?.acknowledged && savedUser?.insertedId)
        {
            let token = jwt.sign({username:userObject?.username,email:userObject?.email},tokenSecret,{expiresIn:'24h'})
            return{
                status:true,
                message: "User registered successfuly",
                data:token,
            }
        }
        return{
            status:false,
            message: "User registered failed"
        };
        console.log(savedUser);
    }catch(error){
        console.log(error);
        let errorMessage = "User registered failed";
        error?.code === 11000 && error?.keyPattern?.username ? (errorMessage = "Username already exist "):null;
        error?.code === 11000 && error?.keyPattern?.email ? (errorMessage = "Email already exist "):null;

        return{
            status:false,
            message: errorMessage,
            error: error?.toString(),
        };
    }
};
const userLogin = async(user)=>{
    try{
        if(!user?.username || !user?.password)
        return{status:false,message:"Please fill up all the fields"};
        let userObject = await MongoDB.db
        .collection(mongoConfig.collection.USERS)
        .findOne({username:user?.username});
        if(userObject){
            let isPasswordVerfied = await bcrypt.compare(user?.password,userObject?.password)
            if (isPasswordVerfied){
                let token = jwt.sign({username:userObject?.username,email:userObject?.email},tokenSecret,{expiresIn:'24h'})
                return{
                    status:true,
                    message: "User login successfuly",
                    data:token,
                };
            }
            else{
                return{
                    status:false,
                    message: "Incorrect password"
                };

            }


        }    
        else{    return{
            status:false,
            message: "No user found"
        };
    }

    }catch (error){
        console.log(error);
        return{
            status:false,
            message: "User login failed",
            error: error?.toString(),
        };
    }
};
const checkUserExist = async(query)=>{
    let message = {
        email:'User already exist',
        username:'This username is taken'
    }
    try{
        let queryType=Object.keys(query)[0];
        let userObject = await MongoDB.db.collection(mongoConfig.collection.USERS)
        .findOne(query);
        return !userObject
        ?{status:true,message:`this ${queryType} is not taken`}
        :{status:false,message:message[queryType]};
    }catch(error){
    }
}

const resetPassword = async (email) => {
    try {
        // Vérifier si l'email existe dans la base de données
        let userObject = await MongoDB.db
            .collection(mongoConfig.collection.USERS)
            .findOne(email);
            console.log(email.email)
            console.log("User object retrieved from the database:", userObject);

        if (userObject) {
            // Générer un jeton de réinitialisation de mot de passe et l'envoyer par email
            const resetToken = generateResetToken();
            /*await MongoDB.db
            .collection(mongoConfig.collection.USERS)
            .updateOne(
                { email: email.email },
                { $set: { password: resetToken } }
            );*/
            await sendResetEmail(email, resetToken);

            // Retourner une réponse réussie
            return {
                status: true,
                message: "Password reset email sent successfully",
            };
        } else {
            return {
                status: false,
                message: "Email not found",
            };
        }
    } catch (error) {
        console.error('Error resetting password:', error);
        return {
            status: false,
            message: "Password reset failed",
            error: error?.toString(),
        };
    }
};

const generateResetToken = () => {
    const token = Math.random().toString(36).substr(2, 10);
    return token;};

const sendResetEmail = async (email, resetToken) => {
    try {
        // Créer un transporteur SMTP pour l'envoi d'e-mails
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'mezenbenkemil@gmail.com', // Adresse e-mail depuis laquelle les e-mails seront envoyés
                pass: 'eunk ckwm auao voop', // Mot de passe de l'adresse e-mail
            },
        });
        console.log(email)
        // Définir les options de l'e-mail
        const mailOptions = {
            from: 'mezenbenkemil@gmail.com', // Adresse e-mail de l'expéditeur
            to: email.email, // Adresse e-mail du destinataire
            subject: 'Réinitialisation de mot de passe', // Sujet de l'e-mail
            text: `Voici votre jeton de réinitialisation de mot de passe : ${resetToken}`, // Corps de l'e-mail
        };

        // Envoyer l'e-mail
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
    } catch (error) {
        console.error('Error sending reset email:', error);
        throw error; // Lancer une erreur si l'envoi d'e-mail échoue
    }};

    const tokenVerification = async (req, res, next) => {
      console.log(
        `authentication.service | tokenVerification | ${req?.originalUrl}`
      );
      try {
        if (
          req?.originalUrl.includes("/login") ||
          req?.originalUrl.includes("/user-exist") ||
          req?.originalUrl.includes("/register") ||
          req?.originalUrl.includes("/refresh-token")
        )
          return next();
        let token = req?.headers["authorization"];
        if (token && token.startsWith("Bearer ")) {
          token = token.slice(7, token?.length);
          jwt.verify(token, config.tokenSecret, (error, decoded) => {
            if (error) {
              res.status(401).json({
                status: false,
                message: error?.name ? error?.name : "Invalid Token",
                error: `Invalid token | ${error?.message}`,
              });
            } else {
              req["username"] = decoded?.username; // Mettre à jour la valeur de username dans req
              next();
            }
          });
        } else {
          res.status(401).json({
            status: false,
            message: "Token is missing",
            error: "Token is missing",
          });
        }
      } catch (error) {
        res.status(401).json({
          status: false,
          message: error?.message ? error?.message : "Authentication failed",
          error: `Authentication failed | ${error?.message}`,
        });
      }
    };
    
    const tokenRefresh = async (req, res) => {
      console.log(`authentication.service | tokenRefresh | ${req?.originalUrl}`);
      try {
        let token = req?.headers["authorization"];
        if (token && token.startsWith("Bearer ")) {
          token = token.slice(7, token?.length);
          jwt.verify(
            token,
            config.tokenSecret,
            { ignoreExpiration: true },
            async (error, decoded) => {
              if (error) {
                res.status(401).json({
                  status: false,
                  message: error?.name ? error?.name : "Invalid Token",
                  error: `Invalid token | ${error?.message}`,
                });
              } else {
                if (decoded?.username && decoded?.email) {
                  let newToken = jwt.sign(
                    { username: decoded?.username, email: decoded?.email },
                    tokenSecret,
                    { expiresIn: "24h" }
                  );
                  res.json({
                    status: true,
                    message: "Token refresh successful",
                    data: newToken,
                  });
                } else {
                  res.status(401).json({
                    status: false,
                    message: error?.name ? error?.name : "Invalid Token",
                    error: `Invalid token | ${error?.message}`,
                  });
                }
              }
            }
          );
        } else {
          res.status(401).json({
            status: false,
            message: error?.name ? error?.name : "Token missing",
            error: `Token missing | ${error?.message}`,
          });
        }
      } catch (error) {
        res.status(401).json({
          status: false,
          message: error?.name ? error?.name : "Token refresh failed",
          error: `Token refresh failed | ${error?.message}`,
        });
      }
    };
module.exports = {userRegister,userLogin,checkUserExist,resetPassword,tokenRefresh,tokenVerification};