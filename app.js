const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const sqlite3 = require('sqlite3').verbose(); // 引入 sqlite3 模組

const indexRouter = require('https://taxihuang030926.github.io/inflation/routes/index');
const usersRouter = require('https://taxihuang030926.github.io/inflation/routes/users');

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

module.exports = app;

// 連接資料庫
let db = new sqlite3.Database('https://taxihuang030926.github.io/inflation/db/InternationalCrudeOilPrice2000_2024.db', (err) => {
    if (err) {
        console.error('Connection Failed to Database:', err.message);
    } else {
        console.log('Successfully Connected to Database');
    }
});

// 建立IntCruOilPrice table
db.run(`CREATE TABLE IF NOT EXISTS IntCruOilPrice (
    yr INTEGER NOT NULL,
    season INTEGER NOT NULL,
    wti FLOAT NOT NULL,
    dub FLOAT NOT NULL,
    brent FLOAT NOT NULL,
    CONSTRAINT yr_sea PRIMARY KEY(yr, season)
)`);

// 撰寫 /api/price 路由，用 POST 取得所有季度的價格
app.post('/api/price', (req, res) => {
    db.all('SELECT * FROM IntCruOilPrice', (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json(rows);
        res.send(rows);
    });
});

// 撰寫 post /api 路由，使用 SQLite 查詢某 year 和 season 提供的資料
app.post('/api/search', (req, res) => {
    db.all('SELECT * FROM IntCruOilPrice WHERE yr = ? AND season = ?', [parseInt(req.body.year), parseInt(req.body.season)], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if(rows.length > 0) {
            let row = rows[0];
            row.formatted = `${row.yr}年 Q${row.season} WTI: ${row.wti} DUB: ${row.dub} BRENT: ${row.brent} (USD/桶)`;
            res.send(row.formatted);
        } else {
            res.send("No data found");
        }
    });
});

// 撰寫 post /api/insert 路由，使用 SQLite 新增一筆油價資料 (yr, season, wti, dub, brent) 回傳文字資料顯示新增的 yr 和 season
app.post('/api/insert', (req, res) => {
    db.run('INSERT INTO IntCruOilPrice (yr, season, wti, dub, brent) VALUES (?, ?, ?, ?, ?)', [parseInt(req.body.year), parseInt(req.body.season), parseFloat(req.body.wti), parseFloat(req.body.dub), parseFloat(req.body.brent)], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.send(`新增成功: ${req.body.year}年 Q${req.body.season}`);
    });
});

app.post('/api/searchRange', (req, res) => {
    const startYear = parseInt(req.body.startYear);
    const endYear = parseInt(req.body.endYear);
    db.all('SELECT * FROM IntCruOilPrice WHERE yr >= ? AND yr <= ? ORDER BY yr, season', [startYear, endYear], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

