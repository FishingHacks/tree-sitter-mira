(primitive_type) @type.builtin
(string_literal) @string
(escape_sequence) @string.escape
(number_literal) @number
(boolean_literal) @boolean
(void_literal) @constant.builtin
((identifier) @variable
 (#match? @variable "^[a-z#_$]+$"))
((identifier) @type
 (#match? @type "^[A-Z]"))
((identifier) @constant
 (#match? @constant "^[A-Z#_$]+$"))
(struct_expression field_name: (identifier) @variable.member)
(struct_statement struct_name: (identifier) @type)
(struct_statement field_name: (identifier) @variable.member)
(impl_statement trait_name: (identifier) @type)
(function_statement (identifier) @function)
(trait_function (identifier) @function)
(annotations (identifier) @function)
(use_list module: (identifier) @module)
(line_comment) @comment
(block_comment) @comment

"(" @punctuation.bracket
")" @punctuation.bracket
"[" @punctuation.bracket
"]" @punctuation.bracket
"{" @punctuation.bracket
"}" @punctuation.bracket
"&" @operator
"+" @operator
"-" @operator
"*" @operator
"/" @operator
"%" @operator
"&" @operator
"|" @operator
"+=" @operator
"-=" @operator
"*=" @operator
"/=" @operator
"%=" @operator
"&=" @operator
"|=" @operator
"^=" @operator
"&&" @operator
"||" @operator
"!" @operator
"~" @operator
"^" @operator
"->" @operator
"=" @operator
"|>" @operator
"==" @operator
"!=" @operator
">=" @operator
"<=" @operator
">" @operator
"<" @operator
">>" @operator
"<<" @operator
"$" @operator
"@" @operator
"::" @punctuation.delimiter
":" @punctuation.delimiter
"," @punctuation.delimiter
";" @punctuation.delimiter

(type_args
  "<" @punctuation.bracket
  ">" @punctuation.bracket)
(type_parameters
  "<" @punctuation.bracket
  ">" @punctuation.bracket)

"let" @keyword
"as" @keyword
"fn" @keyword
"extern" @keyword
"return" @keyword
"if" @keyword
"else" @keyword
"asm" @keyword
"volatile" @keyword
"while" @keyword
; "for" @keyword
; "in" @keyword
"pub" @keyword
"unsized" @keyword
"struct" @keyword
"impl" @keyword
"trait" @keyword
"use" @keyword
"export" @keyword
(never_type) @type.builtin
