/**
 * @file The Treesitter parser for the Mira programming language
 * @author FishingHacks
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "mira",

  rules: {
    // TODO: add the actual grammar rules
    source_file: $ => "hello"
  }
});
