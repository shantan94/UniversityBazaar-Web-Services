const nodemailer=require('nodemailer');

this.sendMail=function(userid,email){
	let transporter=nodemailer.createTransport({
		host:'smtp-mail.outlook.com',
		secureConnection:false,
		port:587,
		auth:{
			user:'ubs_team2@outlook.com',
			pass:'ubs_team2'
		}
	});
	let mailOptions={
		to:email,
		subject:'Account Activation',
		html:'Click on the link below to activate account:<br><a href="https://univbazaarservices.herokuapp.com/users/verify/'+userid+'">Click Here</a>'
	};
	transporter.sendMail(mailOptions,function(error,info){
		if(error)
			console.log(error);
		else{
			console.log('Email sent: '+info.response);
		}
		transporter.close();
	});
}

this.sendPass=function(email,password){
	let transporter=nodemailer.createTransport({
		host:'smtp-mail.outlook.com',
		secureConnection:false,
		port:587,
		auth:{
			user:'ubs_team2@outlook.com',
			pass:'ubs_team2'
		}
	});
	let mailOptions={
		to:email,
		subject:'University Bazaar',
		html:'Hello you can log into your account using: '+password
	};
	transporter.sendMail(mailOptions,function(error,info){
		if(error)
			console.log(error);
		else{
			console.log('Email sent: '+info.response);
		}
		transporter.close();
	});	
}