var Resource = require('deployd/lib/resource')
  , Script = require('deployd/lib/script')
  , util = require('util');

function EventResource() {
  Resource.apply(this, arguments);
}
util.inherits(EventResource, Resource);

EventResource.label = "Event";
EventResource.events = ["get", "post", "put", "delete", "head","beforerequest"];

module.exports = EventResource;

EventResource.prototype.clientGeneration = true;

EventResource.prototype.beforeRequest = function(ctx, domain, cb){
  if(this.events.beforerequest !== undefined){
    this.events.beforerequest.run(ctx, domain, function(err) {
      if(err) return ctx.done(err);
      cb();
    });
  } else {
    cb();
  }
};

EventResource.prototype.handle = function (ctx, next) {
  var parts = ctx.url.split('/').filter(function(p) { return p; });

  var result = {};

  var domain = {
      url: ctx.url
    , parts: parts
    , query: ctx.query
    , body: ctx.body
    , 'this': result
    , getHeader: function (name) {
        if (ctx.req.headers && typeof name == 'string' && name) {
            return ctx.req.headers[name.toLowerCase()];
        }
      }
    , setHeader: function (name, value) {
        if (ctx.res.setHeader) {
            ctx.res.setHeader(name, value);
        }
      }
    , setStatusCode: function (statusCode) {
        if (typeof statusCode !== "number") throw new TypeError("Status code must be a number")
        ctx.res.statusCode = statusCode;
      }
    , setResult: function(val) {
        if (typeof val === 'string' || typeof val === 'object') {
          result = val;
        } else {
          result = '' + val;
        }
    }
  };
  
  this.beforeRequest(ctx, domain, function(){
    if (ctx.method === "POST" && this.events.post) {
      this.events.post.run(ctx, domain, function (err) {
        ctx.done(err, result);
      });
    } else if (ctx.method === "GET" && this.events.get) {
      this.events.get.run(ctx, domain, function (err) {
        ctx.done(err, result);
      });
    } else if (ctx.method === "DELETE" && this.events.delete) {
      this.events.delete.run(ctx, domain, function (err) {
        ctx.done(err, result);
      });
    } else if (ctx.method === "PUT" && this.events.put) {
      this.events.put.run(ctx, domain, function (err) {
        ctx.done(err, result);
      });
    } else if (ctx.method === "HEAD" && this.events.head) {
      this.events.head.run(ctx, domain, function (err) {
        ctx.done();
      });
    } else {
      next();
    }
  }.bind(this));
};
