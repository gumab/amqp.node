var cluster = require('cluster');
var Daemon = require('./lib/removerDaemon').Daemon;
var config = require('config');

if(cluster.isMaster){
	for(var i = 0; i < config.cluster.maxWorker; i++){
		cluster.fork();
	}

	// When any of the workers die the cluster module will emit the 'exit' event.
	// Starting a new process when one dies.
	cluster.on('exit', function (deadWorker, code, signal) {
		console.log('worker %d died (%s). restarting...', deadWorker.process.pid, signal || code);
		var newWorker = cluster.fork();
		console.log('worker ' + newWorker.process.pid + ' born.');
	});
}
else{
	new Daemon().run();
}
