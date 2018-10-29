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
	describe("@templates.render({\"targetId\":\"content\",\"template\":\"basic\"},{\"queueRun\":\"Instant\"});", function () {
		it('Should have a status set', function () {
			expect(window.queue.commandParse('templates.render({"targetId":"content","template":"basic"},{"queueRun":"Instant"});'))
				.to.deep.equal({
				"command":"render",
				"json":{
					"targetId": "content",
					"template": "basic"
				},
				"options":{
					"queueRun": "Instant"
				},
				"queueable":"templates",
				"state":0
				});
		});

	});
});