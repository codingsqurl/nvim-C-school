# 003_LSP_And_Autocomplete

> Language Server Protocol — how Neovim understands your code.

## Level 1 — Intuition

### Concept

LSP separates editors from language intelligence. A language server (running in the background) analyzes your code and sends diagnostics, completions, and navigation data to the editor via JSON-RPC. One server per language. One protocol to rule them all.

### LSP Architecture

```
┌──────────────┐     JSON-RPC      ┌──────────────────┐
│              │ ◄──────────────► │                  │
│   NEOVIM     │     stdio/tcp    │  LANGUAGE SERVER │
│              │                  │                  │
│  nvim-lspconfig                │  rust-analyzer    │
│  cmp                           │  pyright          │
│  lsp UI clients                │  typescript-ls    │
└──────────────┘                  └──────────────────┘
        │
        │   Analyzes while you type:
        │   • Diagnostics (errors, warnings)
        │   • Completions (suggestions)
        │   • Go-to-definition
        │   • Find references
        │   • Rename symbol
        │   • Code actions (fix, refactor)
```

---

## Level 2 — Practical

### LSP Setup with nvim-lspconfig

```lua
-- ~/.config/nvim/lua/core/lsp.lua
local lspconfig = require("lspconfig")
local on_attach = function(client, bufnr)
  local bufopts = { noremap = true, silent = true, buffer = bufnr }

  vim.bo[bufnr].omnifunc = "v:lua.vim.lsp.omnifunc"

  -- LSP keymaps
  local map = vim.keymap.set
  map("n", "gd",         vim.lsp.buf.definition,       bufopts)
  map("n", "gD",         vim.lsp.buf.declaration,      bufopts)
  map("n", "gi",         vim.lsp.buf.implementation,   bufopts)
  map("n", "gr",         vim.lsp.buf.references,       bufopts)
  map("n", "K",          vim.lsp.buf.hover,            bufopts)
  map("n", "<leader>rn", vim.lsp.buf.rename,           bufopts)
  map("n", "<leader>ca", vim.lsp.buf.code_action,      bufopts)
  map("n", "[d",         vim.diagnostic.goto_prev,     bufopts)
  map("n", "]d",         vim.diagnostic.goto_next,     bufopts)
  map("n", "<leader>e",  vim.diagnostic.open_float,    bufopts)
  map("n", "<leader>q",  vim.diagnostic.setloclist,    bufopts)
end

-- Capabilities for autocomplete integration
local capabilities = vim.lsp.protocol.make_client_capabilities()
capabilities = require("cmp_nvim_lsp").default_capabilities(capabilities)

-- Configure servers
local servers = { "lua_ls", "pyright", "rust_analyzer", "ts_ls" }
for _, server in ipairs(servers) do
  lspconfig[server].setup({
    on_attach = on_attach,
    capabilities = capabilities,
  })
end
```

### cmp Autocomplete Configuration

```lua
-- ~/.config/nvim/lua/core/cmp.lua
local cmp = require("cmp")

cmp.setup({
  snippet = {
    expand = function(args)
      require("luasnip").lsp_expand(args.body)
    end,
  },

  mapping = cmp.mapping.preset.insert({
    ["<C-b>"]     = cmp.mapping.scroll_docs(-4),
    ["<C-f>"]     = cmp.mapping.scroll_docs(4),
    ["<C-Space>"] = cmp.mapping.complete(),
    ["<C-e>"]     = cmp.mapping.abort(),
    ["<CR>"]      = cmp.mapping.confirm({ select = true }),
    ["<Tab>"]     = cmp.mapping.select_next_item(),
    ["<S-Tab>"]   = cmp.mapping.select_prev_item(),
  }),

  sources = cmp.config.sources({
    { name = "nvim_lsp" },    -- LSP completions
    { name = "luasnip" },     -- snippet engine
    { name = "buffer" },      -- words in current buffer
    { name = "path" },        -- filesystem paths
  }),
})

-- Search symbol in workspace
vim.keymap.set("n", "<leader>ws", function()
  require("telescope.builtin").lsp_dynamic_workspace_symbols()
end, { desc = "Workspace symbols" })
```

---

## Level 3 — Systems

### Diagnostics Flow

```
┌─────────┐     ┌──────────────┐     ┌─────────────┐
│ Source  │ ──► │ Language     │ ──► │ Neovim      │
│ Code    │     │ Server       │     │ Diagnostic  │
│ Change  │     │ Parses code  │     │ Engine       │
└─────────┘     │ Runs lints   │     │              │
                │ Returns JSON │     │ vim.diagnostic
                └──────────────┘     │ .set()       │
                         │           │              │
                         │           │ ┌──────────┐ │
                         │           │ │Virtual   │ │
                         └───────────┼►│Text      │ │
                                     │ └──────────┘ │
                                     │ ┌──────────┐ │
                                     │ │Sign      │ │
                                     │ │Column    │ │
                                     │ └──────────┘ │
                                     │ ┌──────────┐ │
                                     │ │Location  │ │
                                     │ │List      │ │
                                     │ └──────────┘ │
                                     └─────────────┘
```

### Custom Diagnostic Display

```lua
-- Configure diagnostic signs and virtual text
vim.diagnostic.config({
  virtual_text = {
    prefix = "●",    -- could use nerd font icons
    spacing = 4,
  },
  signs = true,
  underline = true,
  update_in_insert = false,
  severity_sort = true,
  float = {
    border = "rounded",
    source = "always",
    header = "",
    prefix = "",
  },
})

-- Custom sign symbols
local signs = { Error = " E", Warn = " W", Hint = " H", Info = " I" }
for type, icon in pairs(signs) do
  local hl = "DiagnosticSign" .. type
  vim.fn.sign_define(hl, { text = icon, texthl = hl, numhl = hl })
end
```

---

## Level 4 — Expert

### Advanced LSP: Code Actions and Formatting

```lua
-- Auto-format on save with LSP
vim.api.nvim_create_autocmd("BufWritePre", {
  group = vim.api.nvim_create_augroup("LspFormat", { clear = true }),
  callback = function()
    vim.lsp.buf.format({ async = false })
  end,
})

-- Code action: organize imports + format
vim.keymap.set("n", "<leader>cf", function()
  vim.lsp.buf.code_action({
    context = { only = { "source.organizeImports" } },
    apply = true,
  })
  vim.lsp.buf.format({ async = true })
end, { desc = "Code fix + format" })

-- Null-ls / none-ls for external formatters and linters
-- Example: eslint, prettier, stylua
local null_ls = require("null-ls")
null_ls.setup({
  sources = {
    null_ls.builtins.formatting.stylua,
    null_ls.builtins.formatting.prettier,
    null_ls.builtins.diagnostics.eslint_d,
  },
})
```

---

## EXERCISES

1. Set up nvim-lspconfig for 3 languages: `lua_ls`, `pyright`, and `rust_analyzer`. Verify `:LspInfo` shows them attached.
2. Configure nvim-cmp with LSP, buffer, and path sources. Type code in a buffer and verify completions appear.
3. Map and use `gd` (go-to-definition), `gr` (references), `<leader>rn` (rename), and `<leader>ca` (code action).
4. Add virtual diagnostic text and custom sign symbols. Trigger an intentional error and observe the display.
5. Implement auto-format on save using `vim.lsp.buf.format()`. Test with a multi-line expression.

## QUIZ

1. How does the editor and language server communicate?
2. What is `on_attach` and why is it needed?
3. How do `nvim_lsp` and `buffer` completion sources differ?
4. What does `vim.diagnostic.config({ virtual_text = true })` do?
5. Why pass `capabilities` from `cmp_nvim_lsp` to `lspconfig[server].setup()`?

---

## Navigation

**Parent**: [[000_NEOVIM_MOC|NEOVIM]]

**Synapses**:
- [[002_Configuration_And_Plugins|NEOVIM 002]] - Plugin setup
- [[004_Plugin_Development|NEOVIM 004]] - Writing plugins
- [[001_Language_Paradigms|LANGUAGES 001]] - Language servers per language
- [[001_Mental_Models|CORE 001]] - Client-server model
