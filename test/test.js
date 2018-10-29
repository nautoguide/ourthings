var expect = chai.expect;

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