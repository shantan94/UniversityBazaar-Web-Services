const mysql=require('mysql');
const express=require('express');
const app=express();
const bodyParser=require("body-parser");
app.use(bodyParser.json());

const connection=mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'root',
    database:'uta'
});

connection.connect();

app.get('/',function(req,res){
    return res.send({ error: true, message: 'hello' });
});

app.post('/users/login',(req,res)=>{
    let userid=req.body.userid;
    let password=req.body.password;
    connection.query(`select * from users where userid=${userid} and password=md5('${password}')`,function(error, data){
        if(!data.length)
            return res.send({error:true,status:400,message:'Login Failed Username or Password does not exist'});
        return res.send({error:false,status:200,result:data,message:'Passed'});
    });
});

app.get('/users/verify/:userid',function(req,res){
    let userid=req.params.userid;
    connection.query(`update users set activate=true where userid=${userid}`,function(error,results){
        if(results.affectedRows===0)
            return res.sendStatus(400);
        return res.send("Activation Successfull you can access your account");
    });
});

app.post('/users/register',function(req,res){
    let userid=req.body.userid;
    let name=req.body.name;
    let age=req.body.age;
    let gender=req.body.gender;
    let email=req.body.email;
    let password=req.body.password;
    let phone=req.body.phone;
    let query=`insert into users values(${userid},'${name}',${age},'${gender}','${email}',md5('${password}'),${phone},false)`;
    connection.query(query,function(error,results,fields){
        if(error)
            return res.send({error:true,status:400,message:'Username Already Exists'});
        return res.send({error:false,status:200,data:results,message:'Insert Successful'});
    });
});

app.listen(process.env.PORT||8080, function(){
    console.log("Listening on 5000 port");
});