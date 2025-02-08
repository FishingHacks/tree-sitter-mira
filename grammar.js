/**
 * @file The Treesitter parser for the Mira programming language
 * @author FishingHacks
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const PREC = {
  call: 15,
  field: 14,
  try: 13,
  unary: 12,
  cast: 11,
  multiplicative: 10,
  additive: 9,
  shift: 8,
  bitand: 7,
  bitxor: 6,
  bitor: 5,
  comparative: 4,
  and: 3,
  or: 2,
  range: 1,
  assign: 0,
  closure: -1,
};
const TOKEN_TREE_NON_SPECIAL_PUNCTUATION = [
  '+', '-', '*', '/', '%', '^', '!', '&', '|', '&&', '||', '<<',
  '>>', '+=', '-=', '*=', '/=', '%=', '^=', '&=', '|=', '<<=',
  '>>=', '=', '==', '!=', '>', '<', '>=', '<=', '@', '_', '.',
  '..', '..=', ',', ';', ':', '::', '->', '=>', '?', '|>',
];
const numeric_types = ['u8', 'u16', 'u32', 'u64', 'usize', 'i8', 'i16', 'i32', 'i64', 'isize', 'f32', 'f64'];
const primitive_types = numeric_types.concat('bool', 'str', 'char', 'void');

module.exports = grammar({
  name: "mira",

  externals: $ => [
    $.string_content,
    $.identifier_content,
    $.block_comment_content,
    $._error_sentinel,
  ],

  extras: $ => [
    /\s/,
    $.line_comment,
    $.block_comment,
  ],

  rules: {
    source_file: $ => seq(optional($.shebang), repeat($.global_statement)),
    global_statement: $ => choice($.function_statement, $.annotations, $.let_statement, $.use_statement, $.trait_statement, $.struct_statement),
    local_statement: $ => choice(
      $.expression_statement,
      $.annotations,
      $.let_statement,
      $.return_statement,
      ';',
      $.export_statement,
      $.if_statement,
      $.while_statement,
    ),
    line_comment: _ => seq('//', /[^\n]+/),
    block_comment: $ => seq('/*', $.block_comment_content),

    struct_statement: $ => seq(
      'struct',
      field('struct_name', $.identifier),
      '{',
      sepBy(',', seq(field('field_name', $.identifier), ':', field('type', $.type))),
      optional(','),
      optional($.struct_impls),
      '}',
    ),
    struct_impls: $ => seq(
      ';',
      repeat(choice($.function_statement, $.impl_statement)),
    ),
    impl_statement: $ => seq('impl', field('trait_name', $.identifier), '{', repeat($.function_statement), '}'),
    trait_statement: $ => seq("trait", field('name', $.identifier), '{', repeat($.trait_function), '}'),
    trait_function: $ => seq('fn',
      field('name', $.identifier),
      field('params', $.parameters),
      optional(seq('->', field('return_type', $.type))),
      ';'
    ),
    use_statement: $ => seq(
      'use', field('file', $.string_literal),
      optional($.use_list),
      ';'
    ),
    use_list: $ => prec.right(choice(
      seq('as', field('imported_name', $.identifier)),
      seq('::', field('module', $.identifier), $.use_list),
      seq('::', field('element', $.identifier)),
      seq('::', '{',
        sepBy(',', choice(
          seq(field('element', $.identifier)),
          seq(field('module', $.identifier), $.use_list),
        )),
        optional(','), '}'),
    )),
    while_statement: $ => prec.left(seq(
      'while', '(', field('condition', $.expression), ')', field('body', $.local_statement),
    )),
    if_statement: $ => prec.left(seq(
      'if', '(', field('condition', $.expression), ')', field('if_body', $.local_statement),
      optional(seq('else', field('else_body', $.local_statement)))
    )),
    global_asm: $ => seq('asm', '(', sepBy(',', $.string_literal), optional(','), ')'),
    export_statement: $ => seq('export', field('name', $.identifier), optional(seq('as', field('exported_name', $.identifier))), ';'),
    let_statement: $ => seq(
      'let',
      field('variable_name', $.identifier),
      optional(seq(':', field('type', $.type))),
      '=',
      field('value', $.expression),
      ';'
    ),
    return_statement: $ => seq(
      'return',
      optional(field('value', $.expression)),
      ';',
    ),

    expression_statement: $ => seq(field('expression', $.expression), ';'),

    function_statement: $ => seq(
      optional('pub'),
      optional('extern'),
      'fn',
      optional(field('name', $.identifier)),
      optional(field('type_params', $.type_parameters)),
      field('params', $.parameters),
      optional(seq('->', field('return_type', $.type))),
      choice(
        seq('=', field('body', $.expression), ';'),
        field('body', $.block),
      ),
    ),

    type: $ => prec(1, choice(
      $.reference_type,
      $.never_type,
      $.tuple_type,
      $.generic_type,
      $.array_type,
      $.dyn_type,
      $.function_type,
      $.macro_invocation,
      $.path_no_generic,
      alias(choice(...primitive_types), $.primitive_type),
    )),
    reference_type: $ => seq('&', field('type', $.type)),
    never_type: _ => '!',
    tuple_type: $ => seq(
      '(',
      sepBy1(',', $.type),
      optional(','),
      ')',
    ),
    generic_type: $ => seq(
      field('type', $.path_no_generic),
      field('type_arguments', $.type_args)
    ),
    array_type: $ => seq(
      '[',
      field('element', $.type),
      optional(seq(
        ';',
        field('length', $.number_literal),
      )),
      ']',
    ),
    dyn_type: $ => prec.left(seq('dyn', field('traits',
      sepBy1('+', field('trait', $.path_no_generic))
    ))),
    function_type: $ => prec(PREC.call, seq(
      'fn',
      field('parameters', $.anon_parameters),
      optional(seq('->', field('return_type', $.type))),
    )),

    type_parameters: $ => seq(
      '<',
      sepBy1(',', seq(
        optional('unsized'),
        $.identifier,
        optional(seq(
          ':',
          sepBy1('+', field('trait', $.path_no_generic))
        )),
      )),
      optional(','),
      '>',
    ),
    type_args: $ => seq(
      token(prec(1, '<')),
      sepBy1(',', $.type),
      optional(','),
      '>',
    ),
    anon_parameters: $ => seq(
      '(',
      sepBy(',', field('type', $.type)),
      optional(','),
      ')',
    ),
    parameters: $ => seq(
      '(',
      sepBy(',', seq(
        field('name', $.identifier),
        ':',
        field('type', $.type),
      )),
      optional(','),
      ')',
    ),
    number_literal: $ => choice($.dec_number_literal, $.hex_bin_oct_number_literal),
    hex_bin_oct_number_literal: _ => /0[xbo][0-9a-fA-F]+([g-zG-Z_$#][0-9a-zA-Z$_#]*)?/,
    dec_number_literal: _ => /[0-9.]+([a-zA-Z$_#][a-zA-Z$_#0-9]*)?/,
    expression: $ => choice(
      $.unary_expression,
      $.binary_expression,
      $.assignment_expression,
      $.compound_assignment_expression,
      $.type_cast_expression,
      $.call_expression,
      $.literal,
      prec.left($.path_generics),
      alias(choice(...primitive_types), $.identifier),
      $.function_statement,
      $.struct_expression,
      $.array_expression,
      $.tuple_expression,
      prec(1, $.macro_invocation),
      $.index_expression,
      $.parenthesized_expression,
      $.asm_expression,
    ),
    asm_expression: $ => prec.left(1000, seq(
      'asm', optional('volatile'), '(', sepBy(',', $.string_literal), optional(','),
      // outputs
      optional(seq(
        ':', optional(seq('[', $.identifier, ']', $.string_literal, '(', $.type, ')')),
        // inputs
        optional(seq(
          ':', sepBy(',', seq(
            seq('[', $.identifier, ']', $.string_literal, '(', $.identifier, ')')
          )), optional(','),
          // clobber
          optional(seq(
            ':', sepBy(',', $.string_literal), optional(','),
          )),
        )),
      )),
      ')'
    )),
    unary_expression: $ => prec(PREC.unary, seq(
      choice('+', '-', '*', '&', '!', '~'),
      $.expression,
    )),
    binary_expression: $ => {
      const table = [
        [PREC.and, '&&'],
        [PREC.or, '||'],
        [PREC.bitand, '&'],
        [PREC.bitor, '|'],
        [PREC.bitxor, '^'],
        [PREC.comparative, choice('==', '!=', '<', '<=', '>', '>=', '|>')],
        [PREC.shift, choice('<<', '>>')],
        [PREC.additive, choice('+', '-')],
        [PREC.multiplicative, choice('*', '/', '%')],
      ];

      // @ts-ignore
      return choice(...table.map(([precedence, operator]) => prec.left(precedence, seq(
        field('left', $.expression),
        // @ts-ignore
        field('operator', operator),
        field('right', $.expression),
      ))));
    },
    assignment_expression: $ => prec.left(PREC.assign, seq(
      field('left', $.expression),
      '=',
      field('right', $.expression),
    )),
    compound_assignment_expression: $ => prec.left(PREC.assign, seq(
      field('left', $.expression),
      field('operator', choice('+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>=')),
      field('right', $.expression),
    )),
    type_cast_expression: $ => prec.left(PREC.cast, seq(
      field('value', $.expression),
      'as',
      field('type', $.type),
    )),
    call_expression: $ => prec(PREC.call, seq(
      field('function', $.expression),
      optional(field('generics', $.type_args)),
      field('arguments', $.arguments),
    )),
    arguments: $ => seq('(', sepBy(',', $.expression), optional(','), ')'),
    index_expression: $ => prec(PREC.call, seq($.expression, '[', $.expression, ']')),
    struct_expression: $ => seq(
      choice('.', field('name', $.path_generics)),
      '{',
      sepBy(',', seq(
        field('field_name', $.identifier),
        ':',
        field('field_value', $.expression),
      )),
      optional(','),
      '}',
    ),
    array_expression: $ => seq('[', sepBy(',', $.expression), optional(','), ']'),
    tuple_expression: $ => seq(
      '.',
      choice(
        seq('(', sepBy(',', $.expression), optional(','), ')'),
        seq('[', sepBy(',', $.expression), optional(','), ']'),
      )
    ),
    parenthesized_expression: $ => seq('(', $.expression, ')'),

    block: $ => seq('{', repeat($.local_statement), '}',),

    macro_invocation: $ => prec(200, seq(
      $.identifier,
      '!',
      $.delim_token_tree,
    )),
    delim_token_tree: $ => choice(
      seq('(', repeat($.delim_tokens), ')'),
      seq('{', repeat($.delim_tokens), '}'),
      seq('[', repeat($.delim_tokens), ']'),
    ),
    delim_tokens: $ => choice(
      $.non_delim_token,
      alias($.delim_token_tree, $.token_tree),
    ),
    non_delim_token: $ => choice(
      '$',
      $.literal,
      $.identifier,
      alias(choice(...primitive_types), $.primitive_type),
      prec.right(repeat1(choice(...TOKEN_TREE_NON_SPECIAL_PUNCTUATION))),
      'as', 'fn', 'for', 'if', 'impl', 'let', 'pub', 'return', 'struct', 'trait', 'use', 'while', 'asm',
    ),
    path_no_generic: $ => sepBy1('::', $.identifier),
    path_generics: $ => prec.right(sepBy1('::', seq($.identifier, optional($.type_args)))),

    annotations: $ => seq('@', $.identifier, '(', repeat($.delim_tokens), ')'),
    literal: $ => prec(-1, choice(
      $.string_literal,
      $.number_literal,
      $.boolean_literal,
      alias('void', $.void_literal),
    )),

    boolean_literal: _ => choice('true', 'false'),
    string_literal: $ => seq(
      '"',
      repeat(choice($.escape_sequence, $.string_content)),
      '"',
    ),
    escape_sequence: _ => /\\([^u]|u)/,
    identifier: $ => choice(/[a-zA-Z_#$][a-zA-Z0-9_]*/, $.identifier_string_literal, $.macro_invocation),
    identifier_string_literal: $ => seq(
      '`',
      repeat(choice($.escape_sequence, $.identifier_content)),
      '`',
    ),
    shebang: _ => /#![\s]*[^\[].+/,
  }
});

/**
 * Creates a rule to match one or more of the rules separated by the separator.
 *
 * @param {RuleOrLiteral} sep - The separator to use.
 * @param {RuleOrLiteral} rule
 *
 * @returns {SeqRule}
 */
function sepBy1(sep, rule) {
  return seq(rule, repeat(seq(sep, rule)));
}


/**
 * Creates a rule to optionally match one or more of the rules separated by the separator.
 *
 * @param {RuleOrLiteral} sep - The separator to use.
 * @param {RuleOrLiteral} rule
 *
 * @returns {ChoiceRule}
 */
function sepBy(sep, rule) {
  return optional(sepBy1(sep, rule));
}
