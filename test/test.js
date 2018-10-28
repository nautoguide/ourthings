var expect = chai.expect;

describe('#mohocore.data.neun', function () {
	describe("return", function () {
		it('Should return true when empty', function () {
			expect(mohocore.data.neun('')).to.equal(true);
		});

		it('Should return true when undefined CASE1', function () {
			expect(mohocore.data.neun(undefined)).to.equal(true);
		});

		it('Should return true when undefined CASE2', function () {
			expect(mohocore.data.neun()).to.equal(true);
		});

		it('Should return true when -1', function () {
			expect(mohocore.data.neun(-1)).to.equal(true);
		});

		it('Should return true when null', function () {
			expect(mohocore.data.neun(null)).to.equal(true);
		});

		it('Should return true when "null"', function () {
			expect(mohocore.data.neun("null")).to.equal(true);
		});


		it('Should return false when "foo"', function () {
			expect(mohocore.data.neun("foo")).to.equal(false);
		});

	});
});