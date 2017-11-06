require("chai").should();

const findDependencies = require("../");

describe("findDependencies", function() {
  it("should return empty dependency list and empty module map for non-angular files", function() {
    const source = "var jquery = {};";
    const deps = {
      dependencies: [],
      modules: {}
    };
    findDependencies(source).should.eql(deps);
  });

  it("should capture simple module declaration", function() {
    const source = 'angular.module("test", []);';
    const deps = {
      dependencies: ["ng"],
      modules: {
        test: []
      }
    };
    findDependencies(source).should.eql(deps);
  });

  it("should capture the module dependencies", function() {
    const source = 'angular.module("test", ["one"]);';
    const deps = {
      dependencies: ["ng", "one"],
      modules: {
        test: ["one"]
      }
    };
    findDependencies(source).should.eql(deps);
  });

  it("should capture module dependencies at root level", function() {
    const source =
      'angular.module("test");\nangular.module("another").controller("Ctrl", ["$scope", function ($scope) {}]);';
    const deps = {
      dependencies: ["ng", "test", "another"],
      modules: {}
    };
    findDependencies(source).should.eql(deps);
  });

  it("should capture multiple module declarations", function() {
    const source =
      'angular.module("test", []);\nangular.module("another", ["that"]);';
    const deps = {
      dependencies: ["ng", "that"],
      modules: {
        test: [],
        another: ["that"]
      }
    };
    findDependencies(source).should.eql(deps);
  });

  it("should not include locally declared modules in `dependencies` list", function() {
    const source =
      'angular.module("test", []);\nangular.module("another", ["that", "test"]);';
    const deps = {
      dependencies: ["ng", "that"],
      modules: {
        test: [],
        another: ["that", "test"]
      }
    };
    findDependencies(source).should.eql(deps);
  });

  it("should capture only one copy of duplicated module declaration", function() {
    const source =
      'angular.module("test", ["one"]);\nangular.module("test", ["another"]);';
    const deps = {
      dependencies: ["ng", "another"],
      modules: {
        test: ["another"]
      }
    };
    findDependencies(source).should.eql(deps);
  });

  it("should detect 'ng' module declaration within angular itself", function() {
    const source =
      "function angularModule(){}; function modules(){angularModule('ng')};";
    const deps = {
      dependencies: [],
      modules: {
        ng: []
      }
    };
    findDependencies(source).should.eql(deps);
  });

  it("should ignore import in source", function() {
    const source =
      'import angular from "angular";\n' + 'angular.module("test", []);';

    const deps = {
      dependencies: ["ng"],
      modules: {
        test: []
      }
    };
    findDependencies(source).should.eql(deps);
  });

  it("should capture simple module declaration using a variable instead of a literal module name", function() {
    const source = 'var moduleName = "test"; angular.module(moduleName, []);';
    const deps = {
      dependencies: ["ng"],
      modules: {
        test: []
      }
    };
    findDependencies(source).should.eql(deps);
  });

  it("should not crash on uninitialized variables", function() {
    const source = "var uninitializedVar;";
    findDependencies(source);
  });

  it("should not crash on JSX syntax", function() {
    const source = "var el = <div>${product}</div>";
    findDependencies(source);
  });
});
