const crypto=require('crypto');
const algorithm='aes-256-ctr';
const password='d6F3Efeq';

this.encrypt=function(data){
	let cipher=crypto.createCipheriv(algorithm,password);
	let crypted=cipher.update(data,'utf8','hex');
	crypted+=cipher.final('hex');
	return crypted;
}

this.decrypt=function(data){
	let decipher=crypto.createDecipheriv(algorithm,password)
	let dec=decipher.update(data,'hex','utf8')
	dec+=decipher.final('utf8');
	return dec;
}