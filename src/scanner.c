#include "tree_sitter/parser.h"
#include "tree_sitter/alloc.h"
#include <wctype.h>

enum TokenType {
    StringContent,
    IdentifierContent,
    BlockCommentContent,
    ErrorSentinel,
};

typedef struct {
    char _marker;
} Scanner;

void *tree_sitter_mira_external_scanner_create() { return ts_calloc(1, sizeof(Scanner)); }
void tree_sitter_mira_external_scanner_destroy(void *payload) { ts_free((Scanner *)payload); }
unsigned tree_sitter_mira_external_scanner_serialize(void *payload, char *buffer) {
    Scanner *scanner = (Scanner *)payload;
    buffer[0] = (char)0;
    return 1;
}
void tree_sitter_mira_external_scanner_deserialize(void *payload, const char *buffer, unsigned length) {
    Scanner *scanner = (Scanner *)payload;
}
static inline bool is_num_char(int32_t c) { return c == '_' || iswdigit(c); }
static inline void advance(TSLexer *lexer) { lexer->advance(lexer, false); }
static inline void skip(TSLexer *lexer) { lexer->advance(lexer, true); }
static inline bool process_string(TSLexer *lexer, int32_t quote_char, enum TokenType ty) {
    bool has_content = false;
    for (;;) {
        if (lexer->lookahead == quote_char || lexer->lookahead == '\\') {
            break;
        }
        if (lexer->eof(lexer)) {
            return false;
        }
        has_content = true;
        advance(lexer);
    }
    lexer->result_symbol = ty;
    lexer->mark_end(lexer);
    return has_content;
}
static inline bool process_block_comment_content(TSLexer *lexer) {
    for (;;) {
        if (lexer->eof(lexer)) return false;
        if (lexer->lookahead == '*') {
            advance(lexer);
            if (lexer->eof(lexer)) return false;
            if (lexer->lookahead == '/') {
                advance(lexer);
                lexer->result_symbol = BlockCommentContent;
                lexer->mark_end(lexer);
                return true;
            }
        } else advance(lexer);
    }
}

bool tree_sitter_mira_external_scanner_scan(void *payload, TSLexer *lexer, const bool *valid_symbols) {
    if (valid_symbols[ErrorSentinel]) {
        return false;
    }
    Scanner* scanner = (Scanner*)payload;
    if (valid_symbols[StringContent])
        return process_string(lexer, '"', StringContent);
    if (valid_symbols[IdentifierContent])
        return process_string(lexer, '`', IdentifierContent);
    if (valid_symbols[BlockCommentContent])
        return process_block_comment_content(lexer);
    return false;
}
