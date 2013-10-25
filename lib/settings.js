
var settings = {};

// get a setting by keyname
// undefined if no such setting has been set
module.exports.get = function(key) {
    return settings[key];
};

// set a setting value
// any old setting will be overriden
module.exports.set = function(key, value) {
    settings[key] = value;
};
