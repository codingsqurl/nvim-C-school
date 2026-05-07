# 002_Configuration_And_Plugins

> Building your Neovim environment from a blank init.lua.

## Level 1 — Intuition

### Concept

Neovim configuration lives in `~/.config/nvim/init.lua`. Everything — keymaps, plugins, settings — is configured through Lua. This gives you a programmable text editor that adapts to your workflow, not the other way around.

### Directory Structure

```
~/.config/nvim/
├── init.lua              entry point
├── lua/
│   ├── core/             basic settings
│   │   ├── options.lua   vim.opt.*
│   │   ├── keymaps.lua   vim.keymap.set()
│   │   └── autocommands.lua
│   ├── plugins/          lazy.nvim specs
│   └── utils/            helper functions
├── after/                overrides (loaded last)
│   └── ftplugin/         filetype-specific config
└── plugin/               scripts loaded at startup
```

---

## Level 2 — Practical

### init.lua Foundation

```lua
-- ~/.config/nvim/init.lua

-- Bootstrap lazy.nvim (plugin manager)
local lazypath = vim.fn.stdpath("data") .. "/lazy/lazy.nvim"
if not vim.loop.fs_stat(lazypath) then
  vim.fn.system({
    "git", "clone", "--filter=blob:none",
    "https://github.com/folke/lazy.nvim.git", lazypath,
  })
end
vim.opt.rtp:prepend(lazypath)

-- Core options
local opt = vim.opt

opt.number = true            -- line numbers
opt.relativenumber = true    -- relative line numbers
opt.tabstop = 2              -- tab width
opt.shiftwidth = 2           -- indent width
opt.expandtab = true         -- spaces instead of tabs
opt.smartindent = true
opt.wrap = false             -- no line wrapping
opt.swapfile = false
opt.undofile = true          -- persistent undo
opt.ignorecase = true        -- case-insensitive search
opt.smartcase = true         -- ...unless uppercase used
opt.termguicolors = true     -- 24-bit color
opt.signcolumn = "yes"       -- always show sign column
opt.updatetime = 250         -- faster CursorHold
opt.mouse = "a"              -- enable mouse
```

### Key Mappings

```lua
-- Map leader to space
vim.g.mapleader = " "
vim.g.maplocalleader = " "

local map = vim.keymap.set

-- Better window navigation
map("n", "<C-h>", "<C-w>h", { desc = "Go to left window" })
map("n", "<C-j>", "<C-w>j", { desc = "Go to lower window" })
map("n", "<C-k>", "<C-w>k", { desc = "Go to upper window" })
map("n", "<C-l>", "<C-w>l", { desc = "Go to right window" })

-- Move lines in visual mode
map("v", "J", ":m '>+1<CR>gv=gv", { desc = "Move line down" })
map("v", "K", ":m '<-2<CR>gv=gv", { desc = "Move line up" })

-- Clear search highlight
map("n", "<Esc>", "<cmd>nohlsearch<CR>")

-- Plugin keymaps
map("n", "<leader>ff", "<cmd>Telescope find_files<CR>", { desc = "Find files" })
map("n", "<leader>fg", "<cmd>Telescope live_grep<CR>", { desc = "Live grep" })
map("n", "<leader>fb", "<cmd>Telescope buffers<CR>", { desc = "Find buffers" })
map("n", "<leader>fh", "<cmd>Telescope help_tags<CR>", { desc = "Help tags" })
```

### Plugin Spec with lazy.nvim

```lua
require("lazy").setup({
  -- Colorscheme
  {
    "folke/tokyonight.nvim",
    lazy = false,
    priority = 1000,
    config = function()
      vim.cmd.colorscheme("tokyonight-night")
    end,
  },

  -- Telescope: fuzzy finder
  {
    "nvim-telescope/telescope.nvim",
    dependencies = { "nvim-lua/plenary.nvim" },
    keys = {
      { "<leader>ff", "<cmd>Telescope find_files<CR>", desc = "Find Files" },
      { "<leader>fg", "<cmd>Telescope live_grep<CR>", desc = "Live Grep" },
    },
    config = function()
      require("telescope").setup({
        defaults = {
          layout_strategy = "horizontal",
          layout_config = { prompt_position = "top" },
          sorting_strategy = "ascending",
        },
      })
    end,
  },

  -- Treesitter: syntax highlighting
  {
    "nvim-treesitter/nvim-treesitter",
    build = ":TSUpdate",
    config = function()
      require("nvim-treesitter.configs").setup({
        ensure_installed = { "c", "lua", "rust", "python", "javascript" },
        auto_install = true,
        highlight = { enable = true },
        indent = { enable = true },
      })
    end,
  },

  -- Which-key: discover keymaps
  {
    "folke/which-key.nvim",
    event = "VeryLazy",
    config = function()
      require("which-key").setup()
    end,
  },
})
```

---

## Level 3 — Systems

### Autocommands

```lua
-- Create augroup for clean reloading
local augroup = vim.api.nvim_create_augroup
local autocmd = vim.api.nvim_create_autocmd

local user_group = augroup("UserConfig", { clear = true })

-- Trim trailing whitespace on save
autocmd("BufWritePre", {
  group = user_group,
  pattern = "*",
  command = [[%s/\s\+$//e]],
})

-- Highlight yanked text
autocmd("TextYankPost", {
  group = user_group,
  callback = function()
    vim.highlight.on_yank({ higroup = "IncSearch", timeout = 200 })
  end,
})

-- Auto-resize splits on window resize
autocmd("VimResized", {
  group = user_group,
  command = "wincmd =",
})
```

---

## Level 4 — Expert

### Lazy-Loading Strategies

```lua
-- Lazy-load by filetype
{ "mfussenegger/nvim-jdtls", ft = "java" }

-- Lazy-load by command
{ "nvim-neorg/neorg", cmd = "Neorg" }

-- Lazy-load by keymap
{ "folke/trouble.nvim", keys = { { "<leader>xx", "<cmd>Trouble<CR>" } } }

-- Lazy-load by event
{ "rcarriga/nvim-notify", event = "VeryLazy" }

-- Profiling: :Lazy profile to find slow plugins
```

---

## EXERCISES

1. Create a new `~/.config/nvim/` from scratch. Write `init.lua` that sets `number`, `relativenumber`, and `expandtab`.
2. Install lazy.nvim and add telescope.nvim. Map `<leader>ff` to find_files. Verify it works.
3. Add nvim-treesitter with 3 language parsers. Confirm syntax highlighting changes with `:InspectTree`.
4. Create a custom leader key sequence (`<leader>ev`) that opens your `init.lua` in a split.
5. Profile your startup time with `nvim --startuptime startup.log`. Identify plugins adding >50ms. Lazy-load them.

## QUIZ

1. Why use `vim.keymap.set` instead of `vim.api.nvim_set_keymap`?
2. What is the purpose of `lazy = false` in a lazy.nvim spec?
3. How do you ensure treesitter parsers are installed for specific languages?
4. What does `{ clear = true }` do in `nvim_create_augroup`?
5. Name three lazy-loading triggers available in lazy.nvim.

---

## Navigation

**Parent**: [[000_NEOVIM_MOC|NEOVIM]]

**Synapses**:
- [[001_Vim_Mastery|NEOVIM 001]] - Motions and operators
- [[003_LSP_And_Autocomplete|NEOVIM 003]] - LSP configuration
- [[001_Mental_Models|CORE 001]] - State machine model
