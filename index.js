"use strict";

const babylon = require("babylon");
const traverse = require("babel-traverse");
const _ = require("lodash");

function findDependencies(source) {
  const potentialModuleNameVariable = {};
  const modules = {};
  const rootDeps = [];

  traverse.default(
    babylon.parse(source, {
      plugins: ["jsx"],
      sourceType: "module"
    }),
    {
      exit: function({ node, parent }) {
        if (canBeModuleNameVariableDeclaration(node)) {
          potentialModuleNameVariable[node.id.name] = node.init.value;
        }

        if (!isAngularModuleStatement(node)) {
          if (isNgModuleDeclaration(node)) {
            modules["ng"] = [];
          }
          return;
        }

        const moduleNameArg = parent.arguments[0];
        const moduleName =
          moduleNameArg.value ||
          potentialModuleNameVariable[moduleNameArg.name];
        if (parent.arguments[1]) {
          // if already declared, will reset dependencies, like how angular behaves (latest declaration wins)
          modules[moduleName] = _.map(parent.arguments[1].elements, "value");
        } else {
          rootDeps.push(moduleName);
        }
      }
    }
  );

  const moduleKeys = _.keys(modules);
  const moduleValues = _.values(modules);

  // aggregates all root + sub dependencies, and remove ones that were declared locally
  const dependencies = _(rootDeps)
    .union(_.flatten(moduleValues))
    .uniq()
    .difference(moduleKeys)
    .value();

  const isAngular = moduleKeys.length > 0 || dependencies.length > 0;
  if (isAngular && !_.has(modules, "ng") && !_.some(dependencies, "ng")) {
    dependencies.unshift("ng");
  }

  return {
    dependencies,
    modules
  };
}

function isAngularModuleStatement(node) {
  return (
    node.type === "MemberExpression" &&
    node.object.name === "angular" &&
    node.property.name === "module"
  );
}

function isNgModuleDeclaration(node) {
  return (
    node.type === "CallExpression" &&
    node.callee.name === "angularModule" &&
    node.arguments.length > 0 &&
    node.arguments[0].value === "ng"
  );
}

function canBeModuleNameVariableDeclaration(node) {
  return (
    node.type === "VariableDeclarator" &&
    node.init &&
    typeof node.init.value === "string"
  );
}

module.exports = findDependencies;
