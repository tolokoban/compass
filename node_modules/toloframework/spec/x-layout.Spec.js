var Calc = require("../ker/com/x-layout/x-layout.com").Calc;

describe("<x-layout>", function() {
    describe("Calc", function() {
        it("should deal with simple numbers.", function() {
            function str(number, unit) {
                var c = new Calc(number, unit);
                return c.toString();
            }
            expect(str(3.14)).toBe('3.14');
            expect(str(-8, 'px')).toBe('-8px');
        });
        it("should deal with simple additions.", function() {
            function checkAdd(n1, u1, n2, u2, expected) {
                var c = new Calc(n1, u1);
                c.add(n2, u2);
                expect(c.toString()).toBe(expected);
            }
            checkAdd(50, '', 30, '', '80');
            checkAdd(50, '%', 30, '%', '80%');
            checkAdd(50, 'px', 30, '%', '50px + 30%');
        });
        it("should deal with successive additions.", function() {
            function checkAdd3(n1, u1, n2, u2, n3, u3, expected) {
                var c = new Calc(n1, u1);
                c.add(n2, u2).add(n3, u3);                
                expect(c.toString()).toBe(expected);
            }
            checkAdd3(50, '', 30, '', 20, '', '100');
            checkAdd3(50, '%', 30, '%', 10, 'vh', '80% + 10vh');
            checkAdd3(50, 'px', 30, '%', 10, 'px', '60px + 30%');
            checkAdd3(50, 'px', 30, '%', 10, '%', '50px + 40%');
            checkAdd3(50, 'px', 30, '%', 10, 'mm', '50px + 30% + 10mm');
        });
    });
});
