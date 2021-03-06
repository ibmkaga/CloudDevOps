// Generated by CoffeeScript 1.7.1
(function() {
  var Q, Server, TODO_COMPOSEMONGO_SERVICE, TODO_COUCH_LOCAL, TODO_COUCH_SERVICE, TODO_MONGOLAB_SERVICE, TODO_MONGO_LOCAL, URL, appEnv, cfEnv, couchDB, express, getComposeMongoURL, getCouchURL, getMongoLabURL, http, mongoDB, ports, todoDB, tx, utils, _;

  TODO_COUCH_SERVICE = "CloudDevops_Cloudant";

  //TODO_MONGOLAB_SERVICE = "todo-mongo-db";

  //TODO_COMPOSEMONGO_SERVICE = "todo-compose-mongo-db";

  TODO_COUCH_LOCAL = "http://127.0.0.1:5984";

  //TODO_MONGO_LOCAL = "mongodb://localhost:27017/db";

  URL = require("url");

  http = require("http");

  Q = require("q");

  _ = require("underscore");

  ports = require("ports");
  cookieParser = require("cookie-parser");
  session = require("express-session");
  //needed for SSO
  passport = require("passport");
  OpenIdConnectionStrategy = require("passport-idaas-openidconnect").IDaaSOIDCStrategy;

  express = require("express");

  cfEnv = require("cfenv");

  couchDB = require("./couch-db");

  //mongoDB = require("./mongo-db");

  tx = require("./tx");

  utils = require("./utils");

  todoDB = null;

  appEnv = cfEnv.getAppEnv({
    name: utils.PROGRAM
  });

  process.on("exit", function(status) {
    return utils.log("process exiting with status " + status);
  });

  exports.start = function(options) {
    //var couchURL, mongoURL, server;
    var couchURL, server;
    if (options.verbose) {
      utils.verbose(true);
    }
    //if (options.db === "cloudant") {
      utils.log("Using Couch DB");
      couchURL = getCouchURL();
      utils.log("using database:  " + couchURL);
      return couchDB.init(couchURL).fail(function(err) {
        utils.log("error initializing database:");
        return utils.logError(err);
      }).then(function(todoDB_) {
        var server;
        todoDB = todoDB_;
        server = new Server(options);
        return server.start();
      }).done();
    //} 
    /*else if (options.db === "mongo") {
      utils.log("Using MongoLab DB");
      mongoURL = getMongoLabURL();
      utils.log("using database:  " + mongoURL);
      todoDB = mongoDB.init(mongoURL);
      server = new Server(options);
      return server.start();
    } else if (options.db === "compose") {
      utils.log("Using Compose Mongo DB");
      mongoURL = getComposeMongoURL();
      utils.log("using database:  " + mongoURL);
      todoDB = mongoDB.init(mongoURL);
      server = new Server(options);
      return server.start();
    }*/
  };

  getCouchURL = function() {
    var endsInSlash, length, url;
    url = appEnv.getServiceURL(TODO_COUCH_SERVICE, {
      pathname: "database",
      auth: ["username", "password"]
    });
    url = url || TODO_COUCH_LOCAL;
    length = url.length - 1;
    endsInSlash = url.indexOf('/', length);
    if (endsInSlash === -1) {
      url = url + '/';
    }
    url = url + 'bluemix-todo';
    return url;
  };

/*  getMongoLabURL = function() {
    var url;
    url = appEnv.getServiceURL(TODO_MONGOLAB_SERVICE);
    url = url || TODO_MONGO_LOCAL;
    return url;
  };*/

/*  getComposeMongoURL = function() {
    var composeDbName, mongoCreds, url;
    mongoCreds = appEnv.getServiceCreds(TODO_COMPOSEMONGO_SERVICE);
    if (mongoCreds) {
      composeDbName = "todoDB";
      url = "mongodb://" + mongoCreds.user + ":" + mongoCreds.password + "@" + mongoCreds.uri + ":" + mongoCreds.port + "/" + composeDbName;
    }
    url = url || TODO_MONGO_LOCAL;
    return url;
  };*/

  Server = (function() {
    function Server(options) {
      if (options == null) {
        options = {};
      }
      if (options.port == null) {
        options.port = appEnv.port;
      }
      if (options.verbose == null) {
        options.verbose = false;
      }
      this.port = options.port, this.verbose = options.verbose;
    }

    Server.prototype.start = function() {
      var app, deferred;
      deferred = Q.defer();
      app = express();
      app.use(cookieParser());
      app.use(session({resave: "true" , saveUninitialized: "true" , secret: "keyboard cat"}));
      app.use(passport.initialize());
      app.use(passport.session());
      
      passport.serializeUser(function(user, done){
      	 done(null, user);
      });
      
      passport.deserializeUser(function(obj, done){
      	done(null, obj);
      })
      app.use(express["static"]("www"));
      app.use(express.json());
      app.use(function(req, res, next) {
        req.tx = tx.tx(req, res, todoDB);
        return next();
      });
      app.get("/api/todos", (function(_this) {
        return function(req, res) {
          return req.tx.search();
        };
      })(this));
      app.post("/api/todos", (function(_this) {
        return function(req, res) {
          return req.tx.create();
        };
      })(this));
      app.get("/api/todos/:id", (function(_this) {
        return function(req, res) {
          return req.tx.read();
        };
      })(this));
      app.put("/api/todos/:id", (function(_this) {
        return function(req, res) {
          return req.tx.update();
        };
      })(this));
      app["delete"]("/api/todos/:id", (function(_this) {
        return function(req, res) {
          return req.tx["delete"]();
        };
      })(this));
      app.listen(this.port, appEnv.bind, (function(_this) {
        return function() {
          utils.log("server starting: " + appEnv.url);
          return deferred.resolve(_this);
        };
      })(this));
      return deferred.promise;
    };

    return Server;

  })();

}).call(this);
