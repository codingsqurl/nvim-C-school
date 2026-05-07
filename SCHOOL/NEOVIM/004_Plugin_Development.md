# 004_Plugin_Development

> Extending Neovim — from colorscheme to full-featured plugin.

## Level 1 — Intuition

### Concept

Neovim plugins are Lua modules that hook into the editor's API. They can manipulate buffers, respond to events, create user commands, and define new UI elements. The API is the same one Neovim uses internally — no privileged code.

### Plugin Anatomy

```
my-plugin/
├── lua/
│   └── my-plugin/
│       ├── init.lua       -- require("my-plugin").setup()
│       ├── config.lua     -- default configuration
│       ├── commands.lua   -- user commands
│       └── utils.lua      -- helpers
├── plugin/
│   └── my-plugin.lua      -- autoloaded at startup (optional)
├── doc/
│   └── my-plugin.txt      -- :help documentation
└── README.md
```

---

## Level 2 — Practical

### Neovim API Essentials

```lua
-- Buffer operations
local buf = vim.api.nvim_get_current_buf()
vim.api.nvim_buf_set_lines(buf, 0, -1, false, { "line 1", "line 2" })
local lines = vim.api.nvim_buf_get_lines(buf, 0, -1, false)

-- Window operations
local win = vim.api.nvim_get_current_win()
vim.api.nvim_win_set_cursor(win, { 5, 0 })
vim.api.nvim_win_set_option(win, "number", true)

-- Create user command
vim.api.nvim_create_user_command(
  "Hello",
  function(opts)
    vim.notify("Hello, " .. (opts.args or "World") .. "!", vim.log.levels.INFO)
  end,
  { nargs = "?", desc = "Say hello" }
)
-- Usage: :Hello Alice

-- Create autocommand
vim.api.nvim_create_autocmd("BufWritePost", {
  pattern = "*.lua",
  command = "echo 'Lua file saved!'",
})

-- Subscribe to events (async)
vim.api.nvim_create_autocmd("LspAttach", {
  callback = function(args)
    local client = vim.lsp.get_client_by_id(args.data.client_id)
    if client and client.server_capabilities.inlayHintProvider then
      vim.lsp.inlay_hint.enable(true, { bufnr = args.buf })
    end
  end,
})
```

### Plugin Module Structure

```lua
-- lua/my-plugin/init.lua
local M = {}

M.defaults = {
  enable_highlight = true,
  filetypes = { "lua", "python" },
  max_lines = 1000,
}

function M.setup(opts)
  M.config = vim.tbl_deep_extend("force", M.defaults, opts or {})

  -- Create highlight group
  if M.config.enable_highlight then
    vim.api.nvim_set_hl(0, "MyPluginHighlight", {
      fg = "#ff9e64",
      bg = "#1a1b26",
      bold = true,
      underline = true,
    })
  end

  -- Set up autocommands
  vim.api.nvim_create_autocmd("BufReadPost", {
    group = vim.api.nvim_create_augroup("MyPlugin", { clear = true }),
    pattern = "*",
    callback = function(args)
      if vim.tbl_contains(M.config.filetypes, vim.bo[args.buf].filetype) then
        require("my-plugin.highlight").apply(args.buf)
      end
    end,
  })

  -- Set up user commands
  require("my-plugin.commands").register()

  -- Set up keymaps
  vim.keymap.set("n", "<leader>mp", function()
    require("my-plugin.picker").show()
  end, { desc = "MyPlugin picker" })
end

return M
```

---

## Level 3 — Systems

### Creating a Colorscheme

```lua
-- lua/my-colorscheme/init.lua — a minimal dark colorscheme
local M = {}

function M.setup()
  vim.cmd("hi clear")
  if vim.fn.exists("syntax_on") then
    vim.cmd("syntax reset")
  end
  vim.o.background = "dark"
  vim.g.colors_name = "my-colorscheme"

  -- Palette
  local c = {
    bg       = "#1a1b26",
    fg       = "#c0caf5",
    comment  = "#565f89",
    keyword  = "#9d7cd8",
    string   = "#9ece6a",
    number   = "#ff9e64",
    func     = "#7aa2f7",
    error    = "#f7768e",
    warning  = "#e0af68",
  }

  -- Highlight groups
  local hl = vim.api.nvim_set_hl
  hl(0, "Normal",       { fg = c.fg,       bg = c.bg })
  hl(0, "Comment",      { fg = c.comment,  italic = true })
  hl(0, "Keyword",      { fg = c.keyword,  bold = true })
  hl(0, "String",       { fg = c.string })
  hl(0, "Number",       { fg = c.number })
  hl(0, "Function",     { fg = c.func })
  hl(0, "ErrorMsg",     { fg = c.error,    bold = true })

  -- UI elements
  hl(0, "StatusLine",   { fg = c.fg,       bg = "#292e42" })
  hl(0, "LineNr",       { fg = "#3b4261" })
  hl(0, "CursorLine",   { bg = "#292e42" })
  hl(0, "Visual",       { bg = "#364a82" })

  -- Treesitter groups (link to standard groups)
  local treesitter_mappings = {
    ["@comment"]         = "Comment",
    ["@keyword"]         = "Keyword",
    ["@string"]          = "String",
    ["@number"]          = "Number",
    ["@function"]        = "Function",
    ["@variable"]        = "Normal",
    ["@type"]            = "Keyword",
    ["@parameter"]       = "Normal",
    ["@operator"]        = "Keyword",
  }
  for ts_group, std_group in pairs(treesitter_mappings) do
    vim.api.nvim_set_hl(0, ts_group, { link = std_group })
  end

  vim.notify("my-colorscheme loaded", vim.log.levels.INFO)
end

return M
```

---

## Level 4 — Expert

### Language-Specific Plugin: Code Runner

```lua
-- Full plugin: run code in a floating terminal
-- lua/code-runner/init.lua
local M = {}

local commands = {
  lua      = "lua %",
  python   = "python3 %",
  rust     = "cargo run",
  c        = "gcc % -o /tmp/a.out && /tmp/a.out",
  javascript = "node %",
}

function M.run()
  local buf = vim.api.nvim_get_current_buf()
  local ft = vim.bo[buf].filetype
  local cmd = commands[ft]

  if not cmd then
    vim.notify("No runner for filetype: " .. ft, vim.log.levels.WARN)
    return
  end

  local filepath = vim.fn.expand("%:p")
  cmd = cmd:gsub("%%", vim.fn.shellescape(filepath))

  -- Create floating window
  local width = math.floor(vim.o.columns * 0.8)
  local height = math.floor(vim.o.lines * 0.6)
  local row = math.floor((vim.o.lines - height) / 2)
  local col = math.floor((vim.o.columns - width) / 2)

  local buf_opts = {
    style = "minimal",
    relative = "editor",
    width = width,
    height = height,
    row = row,
    col = col,
    border = "rounded",
    title = " Code Runner: " .. ft .. " ",
    title_pos = "center",
  }

  local term_buf = vim.api.nvim_create_buf(false, true)
  local win = vim.api.nvim_open_win(term_buf, true, buf_opts)

  vim.fn.termopen(cmd, {
    on_exit = function()
      vim.api.nvim_buf_set_option(term_buf, "modifiable", false)
    end,
  })

  -- Close with <Esc> or q
  local close = function()
    if vim.api.nvim_win_is_valid(win) then
      vim.api.nvim_win_close(win, true)
    end
  end
  vim.keymap.set("t", "<Esc>", close, { buffer = term_buf })
  vim.keymap.set("n", "q", close, { buffer = term_buf })
end

function M.setup(opts)
  commands = vim.tbl_deep_extend("force", commands, opts.commands or {})

  vim.api.nvim_create_user_command("CodeRun", M.run, { desc = "Run current file" })
  vim.keymap.set("n", "<leader>rr", M.run, { desc = "Run code" })
end

return M
```

---

## EXERCISES

1. Create a minimal colorscheme plugin with 8 highlight groups. Test it with `:colorscheme`.
2. Build a plugin that counts words in the current buffer and displays them in the statusline.
3. Write a plugin that toggles between light and dark background with a single command.
4. Extend the code runner to support 5 languages. Add <leader>rr keymap and a user command.
5. Add vimdoc documentation to one of your plugins. Verify `:help` finds it.

## QUIZ

1. What is the difference between `vim.api.nvim_buf_set_lines` and `vim.api.nvim_buf_set_text`?
2. Why use `vim.tbl_deep_extend("force", defaults, user_opts)` in `setup()`?
3. What does `vim.api.nvim_create_augroup("Name", { clear = true })` protect against?
4. How does one create a floating window in Neovim?
5. What directory must documentation files be in for `:help` to find them?

---

## MILESTONE: Create a Full Neovim Plugin

Pick ONE of these and build it end-to-end:

- **Todo highlighter**: Highlight TODO/FIXME/HACK comments. Configurable patterns. Telescope picker to jump between them.
- **Session manager**: Save/restore sessions (buffers, windows, tabs). Auto-save on exit. Telescope integration.
- **Git blame virtual text**: Show git blame inline using `vim.lsp.util.open_floating_preview` style UI. Configurable delay.
- **Project-local snippets**: Per-project snippet files. VS Code snippet format compatibility. LuaSnip integration.

Requirements: `setup()`, user commands, keymaps, documentation, and publish to GitHub with lazy.nvim install instructions.

---

## Navigation

**Parent**: [[000_NEOVIM_MOC|NEOVIM]]

**Synapses**:
- [[002_Configuration_And_Plugins|NEOVIM 002]] - Plugin manager setup
- [[003_LSP_And_Autocomplete|NEOVIM 003]] - LSP API usage
- [[004_Scripting_Languages|LANGUAGES 004]] - Lua scripting
- [[001_Mental_Models|CORE 001]] - API contract model
