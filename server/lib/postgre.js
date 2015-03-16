var pg = require('pg'),
    postgre = module.exports = function postgre(user, pwd, host, db) {
		this.db = 'postgres://'+user+':'+pwd+'@'+host+'/'+db;
    };

postgre.prototype = {
    get: function(sql, params, callback) {

		return pg.connect(this.db, function(err, db){

			if(err) throw new Error('Could not connect to the database');

			db.query(sql, params, function(err, result) {
				db.end();
				callback(err, result.rows, result.rows);
			});

		});
    }
};
