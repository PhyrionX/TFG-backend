var adfly = require('adf.ly')();

module.exports = {
    haveUndefinedJSON: function(json){
        for(var attr in json){
            if (json[attr] == undefined) return true;
        }
        return false;
    },
    shortURL: function(req,res,next){
        adfly.short(req.body.url,function(url){
            return res.status(200).send({
                error: 0,
                url: url
            });
        })

    }
};
