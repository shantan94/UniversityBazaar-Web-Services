const nodemailer=require('nodemailer');

this.sendMail=function(userid,email){
	let transporter=nodemailer.createTransport({
		service:'gmail',
		auth:{
			user:'hotelh630@gmail.com',
			pass:'hoteladmin'
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
		else
			console.log('Email sent: '+info.response);
	});
}