//based on: https://github.com/ElemarJR/QUnit-run

var qunit = require("./qunit").QUnit,
	fs = require("fs"),
	exitcode = 0;

var print = console.log;

var	print_fail = function (msg) {
	print("\33[31m\33[1m" + msg + "\33[0m");
};

var	print_sucess = function (msg) {
	print("\33[32m\33[1m" + msg + "\33[0m");
};

var print_highlight = function (msg) {
	print("\n\33[1m" + msg + "\33[0m");
};

var stopWatch = {
	startTime: null, 
	stopTime: null,
	start: function () {
		this.startTime = new Date();
	},
	stop: function () {
		this.stopTime = new Date();
	},
	elapsedSeconds: function () {
		return (this.stopTime.getMilliseconds() - this.startTime.getMilliseconds()) / 1000;
	}
};

(function () {
	qunit.init();

	qunit.moduleStart = function (data) {
		print_highlight("module: " + data.name);
	};

	qunit.moduleDone = function (data) {
		//print("\n" +
		//	"\33[31m\33[1m" + data.failed + "\33[0m failed. " + 
		//	"\33[32m\33[1m" + data.passed +"\33[0m passed. " + 
		//	"\33[1m" + data.total + "\33[0m total."
		//	);
	};

	qunit.testStart = function (data) {
		print_highlight("\n  test: " +  data.name);
	};

	qunit.testDone = function (data) {
		//print("\n  " + 
		//	"\33[31m\33[1m" + data.failed + "\33[0m failed. " + 
		//	"\33[32m\33[1m" + data.passed +"\33[0m passed. " + 
		//	"\33[1m" + data.total + "\33[0m total."
		//	);
	};

	qunit.done = function (data) {
		stopWatch.stop();
		//print("\nFinished in " + stopWatch.elapsedSeconds() + " seconds.");
		if (data.failed > 0) {
			exitcode = 1;
		}
	};
    
	qunit.begin = function() {
		stopWatch.start();
	};

	qunit.log = function (data) {
		var p = data.result ? print_sucess : print_fail,
			t = "    " ;

		p("\n██" + t + data.message );
		if (data.actual !== data.expected)
		{
			p("██" + t + "Actual = " + data.actual);
			p("██" + t + "Expected = " + data.expected);
		}
	};
} ());

if (process.argv.length < 3) {
	print_fail("Use: node qunit-run <test-script>");
	exitcode = 2;
} else  {
	eval("with (qunit) {" + fs.readFileSync(process.argv[2], "utf-8") + "}");
	qunit.begin();
	qunit.start();
}

//process.exit(exitcode);
