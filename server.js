const express = require('express');
const app = express();
const fs = require('fs');

const port = 4000;

app.use(express.urlencoded({extended: false}));
app.use(express.json());

// 쿠키 파서
const cookieParser = require('cookie-Parser');
app.use(cookieParser());

app.use(async (req, res, next) => {
    // const {auth} = req.cookies;
    console.log("COOKIE", req.cookies);
    const {auth} = req.cookies;

    let member = null;

    if(auth) {
        const sql = "SELECT * FROM user WHERE id=?";
        const [rows] = await db.execute(sql, [auth]);
        member = rows[0];
    }
    
    app.set('member', member);
    next();
});

//mysql DB 설정
const mysql = require('mysql2');
 
// Create the connection pool. The pool-specific settings are the defaults
const pool = mysql.createPool({
  host: 'localhost',
  user: 'sbg0102',
  password: '0102',
  database: 'homepage'
});

// db 세팅
const db = pool.promise();
app.set('db', db);

app.get('/', (req,res) =>{
    const file = fs.readFileSync('./views/index.html');
    res.end(file);
})

// 회원가입
app.get('/join', (req,res) =>{
    const file = fs.readFileSync('./views/join.html');
    res.end(file);
})

app.post('/join', async (req,res) => {
    res.json(req.body);
    const {id, name, pw} = req.body;

    const sql = "SELECT COUNT(*) AS cnt FROM user WHERE id=?";
    const [rows] = await db.await(sql, [id]);
    if(rows[0].cnt>0) {
        console.log("회원 아이디가 있습니다.");
        res.redirect('/');

    } else {
        const sql2 = "INSERT INTO user VALUES(?,?,?)";
        const [rows2] = await db.execute(sql2, [id,name, pw]);
        if(rows2.affectedFows > 0) {
            console.log("회원 가입 성공");
        } 
        res.redirect('/');
    }
})

// 로그인
app.get('/login', async (req,res) => {
    const file = fs.readFileSync('./views/login.html');
    res.end(file);
});

app.post('/login', async (req, res) => 
{
    console.log(req.body);
    const {id, pw} = req.body;
    const sql = "SELECT COUNT(*) AS cnt FROM user WHERE id=? AND pw=?";
    const [rows] = await db.execute(sql,[id,pw]);
    if(rows[0].cnt > 0)
    {
        console.log("로그인 성공");
        //쿠키 
        res.cookie("auth", id);
    }
    else{
        console.log("로그인 실패");
    }

    res.redirect('/');
    res.json(req.body);
})

app.get("/members", async (req,res) => {
    const member = req.app.get('member');
    console.log("MEMBER", member);
    
    if(!member) {
        console.log('회원만 접근 가능합니다.');
        res.redirect('/');
        return;
    }
    
    const sql = "SELECT * FROM user";
    // 목록을 쭉 던져짐
    const [rows] = await db.execute(sql);

    const tr = '<tr><td>{{id}}</td><td>{{name}}</td><td>{{pw}}</td></tr>';
    let tbody = "";
    for(const row of rows) {
        let str = tr.replace('{{id}}', row.id);
        str = str.replace('{{name}}', row.name);
        str = str.replace('{{pw}}', row.pw);

        tdoby += str;
    }

    let file = fs.readFileSync("./views/members/html");
    file = file.toString().repace('{{1}}', tbody);
    res.end(file);
})

app.get('/checkId', async (req, res) => {
    console.log(req.query);
    const {id} = req.query;
    res.json(req.query);

    const sql = "SELECT COUNT(*) AS cnt user WHERE id=?";
    const [rows] = await db.execute(sql,[id]);
    res.json({cnt : rows[0].cnt});
})


app.listen(port,() => {
    console.log(`SEVER Listen at http://localhost:${port}`);
})