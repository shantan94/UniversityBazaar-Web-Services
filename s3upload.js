const AWS=require('aws-sdk');
AWS.config.update({accessKeyId:"",secretAccessKey:""});
const s3=new AWS.S3();

this.upload=function(imageid,image){
	const base64Data=new Buffer(image.replace(/^data:image\/\w+;base64,/,""),'base64');
	const params={
		Bucket:"item-bucket",
		Key:imageid,
		Body:base64Data,
		ACL:"public-read",
		ContentEncoding:"base64",
		ContentType:"image/png"
	}
	s3.upload(params,(err,data)=>{
  		if(err)
  			return console.log(err);
  		console.log('Image successfully uploaded.');
	});
}