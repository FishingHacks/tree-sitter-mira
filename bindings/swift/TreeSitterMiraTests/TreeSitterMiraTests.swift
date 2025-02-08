import XCTest
import SwiftTreeSitter
import TreeSitterMira

final class TreeSitterMiraTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_mira())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Mira grammar")
    }
}
