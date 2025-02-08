package tree_sitter_mira_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_mira "github.com/fishinghacks/tree-sitter-mira.git/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_mira.Language())
	if language == nil {
		t.Errorf("Error loading Mira grammar")
	}
}
