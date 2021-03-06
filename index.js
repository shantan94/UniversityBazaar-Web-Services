const mysql=require('mysql');
const express=require('express');
const app=express();
const bodyParser=require("body-parser");
const mailer=require("./nodemail.js");
const encrypter=require("./encrypter.js");
const s3upload=require("./s3upload.js");
const uuidv1=require("uuid/v1");
app.use(bodyParser.json({limit:'50mb'}));

app.use(function (req,res,next) {
    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Access-Control-Allow-Headers','Origin,X-Requested-With,Content-Type,Accept');
    res.setHeader('Access-Control-Allow-Methods','POST,GET,PATCH,DELETE,OPTIONS');
    next();
});

let connection;

function handleDisconnect() {
  connection=mysql.createConnection({
    host:'',
    user:'',
    password:'',
    database:''
  });
  connection.connect(function(err) {
    if(err) {
      console.log('error when connecting to db:',err);
      setTimeout(handleDisconnect,2000);
    }
  });
  connection.on('error', function(err) {
    console.log('db error', err);
    if(err.code==='PROTOCOL_CONNECTION_LOST') {
      handleDisconnect();
    }else{
      throw err;
    }
  });
}
handleDisconnect();

app.get('/',function(req,res){
    res.send({error:true,message:'hello'});
});

app.post('/users/login',(req,res)=>{
    let userid=req.body.userid;
    let password=encrypter.encrypt(req.body.password);
    connection.query(`select * from users where userid=${userid} and password='${password}' and activate=true`,function(error, data){
        if(data===undefined||!data.length)
            return res.send({error:true,status:400,message:'Login Failed Username or Password does not exist'});
        res.send({error:false,status:200,result:data,message:'Passed'});
    });
});

app.get('/users/verify/:userid',function(req,res){
    let userid=req.params.userid;
    connection.query(`update users set activate=true where userid=${userid}`,function(error,results){
        if(results.affectedRows===0){
            res.sendStatus(400);
            res.close();
        }
        res.send("Activation Successfull you can access your account");
    });
});

app.put('/users/register',function(req,res){
    let userid=req.body.userid;
    let name=req.body.name;
    let age=req.body.age;
    let gender=req.body.gender;
    let email=req.body.email;
    let phone=req.body.phone;
    let query=`update users set name='${name}',age=${age},gender='${gender}',email='${email}',phone=${phone} where userid=${userid}`;
    connection.query(query,function(error,results,fields){
        if(error){
            res.send({error:true,status:400,message:'Bad Request'});
        }
        res.send({error:false,status:200,message:'Profile Updated'});
    });
});

app.put('/users/reset',function(req,res){
    let userid=req.body.userid;
    let password=encrypter.encrypt(req.body.password);
    let query=`update users set password='${password}' where userid='${userid}'`;
    connection.query(query,function(error,results,fields){
        if(results.affectedRows===0)
            res.send({error:true,status:400,message:'Bad Request'});
        else
            res.send({error:false,status:200,message:'Password Updated'});
    })
});

app.post('/users/register',function(req,res){
    let userid=req.body.userid;
    let name=req.body.name;
    let age=req.body.age;
    let gender=req.body.gender;
    let email=req.body.email;
    let password=encrypter.encrypt(req.body.password);
    let phone=req.body.phone;
    let query=`insert into users values(${userid},'${name}',${age},'${gender}','${email}','${password}',${phone},false)`;
    connection.query(query,function(error,results,fields){
        if(error){
            return res.send({error:true,status:400,message:'Username or Email Already Exists'});
        }
        res.send({error:false,status:200,data:results,message:'Insert Successful'});
        mailer.sendMail(userid,email);
    });
});

app.post('/users/forgot',function(req,res){
    let email=req.body.email;
    let query=`select password from users where email='${email}'`;
    connection.query(query,function(error,results,fields){
        if(!results.length){
            return res.send({error:true,status:400,message:'No such email exists'});
        }
        let data=JSON.parse(JSON.stringify(results));
        let decryption=encrypter.decrypt(data[0].password);
        res.send({error:false,status:200,message:'Success'});
        mailer.sendPass(email,decryption);
    });
});

app.post('/users/profile',function(req,res){
    let userid=req.body.userid;
    let query=`select * from users where userid=${userid}`;
    connection.query(query,function(error,results,fields){
        if(!results.length){
            return res.send({error:true,status:400,message:'No Profile'});
        }
        let data=JSON.parse(JSON.stringify(results));
        res.send({error:false,status:200,message:'Success',data:data[0]});
    });
});

app.post('/users/message',function(req,res){
    let query=`select * from messages`;
    connection.query(query,function(error,results,fields){
        if(error){
            return res.send({error:true,status:400,message:'No messages'});
        }
        let data=JSON.parse(JSON.stringify(results));
        res.send({error:false,status:200,message:'Success',data:data});
    });
});

app.post('/users/message/insert',function(req,res){
    let userid=req.body.userid;
    let message=req.body.message;
    let date=req.body.date;
    let query=`insert into messages values('${userid}','${message}','${date}')`;
    connection.query(query,function(error,results,fields){
        if(error){
            return res.send({error:true,status:400,message:'Failed'});
        }
        res.send({error:false,status:200,message:'Success'});
    });
});

app.post('/users/message/instant',function(req,res){
    let date=req.body.date;
    let query=`select * from messages where time>'${date}'`;
    connection.query(query,function(error,results,fields){
        if(results===undefined||!results.length){
            return res.send({error:true,status:400,message:'No messages'});
        }
        let data=JSON.parse(JSON.stringify(results));
        res.send({error:false,status:200,message:'Success',data:data});
    });
});

app.post('/users/items',function(req,res){
    let userid=req.body.userid;
    let itemname=req.body.itemname;
    let description=req.body.description;
    let image=req.body.image;
    let type=req.body.type;
    let price=req.body.price;
    let imageid=uuidv1();
    let query=`insert into items values('${userid}','${itemname}','${description}','${imageid}','${type}','${price}')`;
    connection.query(query,function(error,results,fields){
        if(error){
            return res.send({error:true,status:400,message:'Failed'});
        }
        res.send({error:false,status:200,message:'Success'});
        s3upload.upload(imageid,image);
    });
});

app.post('/users/getitems',function(req,res){
    let type=req.body.type;
    let query=`select * from items where type='${type}'`;
    connection.query(query,function(error,results,fields){
        if(error){
            return res.send({error:true,status:400,message:'Failed'});
        }
        let data=JSON.parse(JSON.stringify(results));
        res.send({error:false,status:200,message:'Success',data:data});
    });
});

app.post('/users/getmyitems',function(req,res){
    let type=req.body.type;
    let userid=req.body.userid;
    let query=`select * from items where type='${type}' and userid='${userid}'`;
    connection.query(query,function(error,results,fields){
        if(error){
            return res.send({error:true,status:400,message:'Failed'});
        }
        let data=JSON.parse(JSON.stringify(results));
        res.send({error:false,status:200,message:'Success',data:data});
    });
});

app.post('/users/setnegotiate',function(req,res) {
    let message=req.body.message;
    let from=req.body.from;
    let to=req.body.to;
    let imageid=req.body.imageid;
    let date=req.body.date;
    let query=`insert into negotiations values('${from}','${to}','${imageid}','${message}','${date}')`;
    connection.query(query,function(error,results) {
        if(error){
            return res.send({error:true,status:400,message:'Failed'});
        }
        res.send({error:false,status:200,message:'Success'});
    })
});

app.post('/users/getnegotiate',function(req,res) {
    let to=req.body.to;
    let from=req.body.from;
    let imageid=req.body.imageid;
    query="select * from negotiations where ((`to`=? and `from`=?) or (`to`=? and `from`=?)) and imageid=?";
    connection.query(query,[to,from,from,to,imageid],function(error,results) {
        if(error){
            console.log(error);
            return res.send({error:true,status:400,message:'Bad Request'});
        }
        let data=JSON.parse(JSON.stringify(results));
        res.send({error:false,status:200,message:'Success',data:data});
    })
});

app.post('/users/getmyusernegotiate',function(req,res) {
    let userid=req.body.userid;
    let imageid=req.body.imageid;
    query="select distinct(`from`) from negotiations where imageid=? and `from`<>?" ;
    connection.query(query,[imageid,userid],function(error,results) {
        if(error)
            return res.send({error:true,status:400,message:'Bad Request'});
        let data=JSON.parse(JSON.stringify(results));
        res.send({error:false,status:200,message:'Success',data:data});
    })
});

app.post('/users/clubs',function(req,res) {
    let name=req.body.name;
    let description=req.body.description;
    let userid=req.body.userid;
    let query=`insert into clubs values('${name}','${description}','${userid}')`;
    connection.query(query,function(error,results) {
        if(error)
            return res.send({error:true,status:400,message:'Club name already exists'});
        res.send({error:false,status:200,message:'Club created'});
    })
});

app.post('/users/getclubs',function(req,res) {
    let query=`select * from clubs`;
    connection.query(query,function(error,results) {
        if(error)
            return res.send({error:true,status:400,message:'Bad Request'});
        let data=JSON.parse(JSON.stringify(results));
        res.send({error:false,status:200,message:'Success',data:data});
    })
});

app.listen(process.env.PORT||8080, function(){
    console.log("Listening on 5000 port");
});