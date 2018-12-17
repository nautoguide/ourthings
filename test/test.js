var expect = chai.expect;

/**
 *  Check the queue object is alive and has the required properties
 */

describe('#Queue function', function () {
	describe("Exist", function () {
		it('Should be in window', function () {
			expect(window).to.have.property('queue');
		});

	});
	describe("Available", function () {
		it('Should have a status set', function () {
			expect(window.queue).to.have.property('status');
		});

	});
});

/**
 *  Tests for command processor
 */

describe('#Queue Command Parse', function () {
	describe("@templates.render({\"targetId\":\"#content\",\"template\":\"#basic\"},{\"queueRun\":\"Instant\"});", function () {
		it('Should have a status set', function () {
			expect(window.queue.commandParse('templates.render({"targetId":"#content","template":"#basic"},{"queueRun":"Instant"});'))
				.to.deep.equal({
				"command":"render",
				"json":{
					"targetId": "#content",
					"template": "#basic"
				},
				"options":{
					"queueRun": "Instant"
				},
				"queueable":"templates",
				"state":0,
				"ucid": 1
				});
		});

	});
});

describe('#Test framework tags', function () {
	describe("templates.render({\"targetId\":\"#logic\",\"template\":\"#for-if-template\"})", function () {
		before(function(done) {
			let cmdObj=window.queue.commandParse('internals.setMemory({"name":"test","mode":"Session","value":{"trueFalse":[true,false],"objects":[{"ElementOne":"Result One"},{"ElementTwo":"Result Two"}]}},{"queueRun":"Instant"});',true);
			cmdObj.commands=[window.queue.commandParse('templates.render({"targetId":"#logic","template":"#for-if-template"});',false)];
			window.queue.commandsQueue([cmdObj]);
			waitQueue(done);

		});
		it('Should produce logic of TrueFalse', function () {
			expect(document.getElementById('logic').innerText.replace(/ /,''))
				.to.equal("TrueFalse");
		});

	});
});

function waitQueue(callback) {
	setTimeout(function(){
		if(window.queue.isWork()===0)
			callback();
		else
			waitQueue(callback);
		}, 100);

}