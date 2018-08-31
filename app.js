var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
var session = require("client-sessions");

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var teamsRouter = require('./routes/teams');
var boardsRouter = require('./routes/boards');
var listsRouter = require('./routes/lists');
var cardsRouter = require('./routes/cards');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

app.use(session({
  cookieName: 'session',
  secret: 'asodjfoahf12fnkdnsafnif1n21',
  duration: 30 * 60 * 1000,
  activeDuration: 5 * 60 * 1000,
}));

function disableCache(req, res, next) {
  res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  next();
}

function requireLogin(req, res, next) {
  if (!req.session.id) {
    res.redirect("/");
  } else {
    next();
  }
};

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/boards', requireLogin, disableCache, boardsRouter);
app.use('/teams', requireLogin, teamsRouter);
app.use('/lists', requireLogin, listsRouter);
app.use('/cards', requireLogin, cardsRouter);
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.send({"error": err.message});
});

module.exports = app;
