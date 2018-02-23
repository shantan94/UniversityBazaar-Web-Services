const mysql=require('mysql');
const express=require('express');
const app=express();
const bodyParser=require("body-parser");
const mailer=require("./nodemail.js");
const encrypter=require("./encrypter.js");
app.use(bodyParser.json());

app.use(function (req,res,next) {
    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Access-Control-Allow-Headers','Origin,X-Requested-With,Content-Type,Accept');
    res.setHeader('Access-Control-Allow-Methods','POST,GET,PATCH,DELETE,OPTIONS');
    next();
});

const connection=mysql.createConnection({
    host:'testdb.c7ocfrrpeiwa.us-west-2.rds.amazonaws.com',
    user:'test',
    password:'testdb12',
    database:'uta'
});

connection.connect();

app.get('/',function(req,res){
    res.send({error:true,message:'hello'});
});

app.post('/users/login',(req,res)=>{
    let userid=req.body.userid;
    let password=encrypter.encrypt(req.body.password);
    connection.query(`select * from users where userid=${userid} and password='${password}' and activate=true`,function(error, data){
        console.log(error);
        if(data===undefined||!data.length)
            return res.send({error:true,status:400,message:'Login Failed Username or Password does not exist'});
        res.send({error:false,status:200,result:data,message:'Passed'});
    });
});

app.get('/users/verify/:userid',function(req,res){
    let userid=req.params.userid;
    connection.query(`update users set activate=true where userid=${userid}`,function(error,results){
        if(results.affectedRows===0)
            res.sendStatus(400);
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
        if(error)
            res.send({error:true,status:400,message:'Bad Request'});
        res.send({error:false,status:200,message:'Profile Updated'});
    });
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
            res.send({error:true,status:400,message:'Username or Email Already Exists'});
            return;
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
            res.send({error:true,status:400,message:'No such email exists'});
            return;
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
            res.send({error:true,status:400,message:'No Profile'});
            return;
        }
        let data=JSON.parse(JSON.stringify(results));
        res.send({error:false,status:200,message:'Success',data:data[0]});
    });
});

app.post('/users/message',function(req,res){
    let query=`select * from messages`;
    connection.query(query,function(error,results,fields){
        if(error){
            res.send({error:true,status:400,message:'No messages'});
            return;
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
            res.send({error:true,status:400,message:'Failed'});
            return;
        }
        res.send({error:false,status:200,message:'Success'});
    });
});

app.post('/users/message/instant',function(req,res){
    let date=req.body.date;
    let query=`select * from messages where time>'${date}'`;
    connection.query(query,function(error,results,fields){
        if(results===undefined||!results.length){
            res.send({error:true,status:400,message:'No messages'});
            return;
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
    let query=`insert into items values('${userid}','${itemname}','${description}',${image},'${type}','${price}')`;
    connection.query(query,function(error,results,fields){
        if(error){
            res.send({error:true,status:400,message:'Failed'});
            return;
        }
        res.send({error:false,status:200,message:'Success'});
    });
});

app.listen(process.env.PORT||8080, function(){
    console.log("Listening on 5000 port");
});