// ===== MARKDOWN RENDERER =====

export function renderMarkdown(md: string): string {
  const lines = md.split('\n');
  const out: string[] = [];
  let i = 0;

  function escapeHtml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderInline(text: string): string {
    // Process [[wikilinks]] first
    text = text.replace(/\[\[([^\]|]+)\]\]/g, (_m, target: string) => {
      const parts = target.split('|');
      const label = parts.length > 1 ? parts[1] : parts[0];
      const linkTarget = parts[0];
      return `<span class="wikilink" data-target="${escapeHtml(linkTarget)}">${escapeHtml(label)}</span>`;
    });
    // Bold
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Italic
    text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // Inline code
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    return text;
  }

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Code blocks ``` ... ```
    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim();
      i++;
      const codeLines: string[] = [];
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(escapeHtml(lines[i]));
        i++;
      }
      i++; // skip closing ```
      out.push(`<pre class="code-block"${lang ? ` data-lang="${escapeHtml(lang)}"` : ''}><code>${codeLines.join('\n')}</code></pre>`);
      continue;
    }

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(trimmed)) {
      out.push('<hr>');
      i++;
      continue;
    }

    // Headers
    if (trimmed.startsWith('#### ')) {
      out.push(`<h4>${renderInline(trimmed.slice(5))}</h4>`);
    } else if (trimmed.startsWith('### ')) {
      out.push(`<h3>${renderInline(trimmed.slice(4))}</h3>`);
    } else if (trimmed.startsWith('## ')) {
      out.push(`<h2>${renderInline(trimmed.slice(3))}</h2>`);
    } else if (trimmed.startsWith('# ')) {
      out.push(`<h1>${renderInline(trimmed.slice(2))}</h1>`);
    }
    // Blockquote
    else if (trimmed.startsWith('> ')) {
      out.push(`<blockquote>${renderInline(trimmed.slice(2))}</blockquote>`);
    }
    // Unordered list
    else if (/^[-*]\s/.test(trimmed)) {
      const listItems: string[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i].trim())) {
        listItems.push(`<li>${renderInline(lines[i].trim().slice(2))}</li>`);
        i++;
      }
      out.push(`<ul>${listItems.join('')}</ul>`);
      continue;
    }
    // Table (pipe-separated)
    else if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const tableRows: string[] = [trimmed];
      i++;
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableRows.push(lines[i].trim());
        i++;
      }

      const renderRow = (row: string, tag: 'th' | 'td'): string => {
        const cells = row.split('|').slice(1, -1).map(c => c.trim());
        const cellHtml = cells.map(c => {
          if (/^[-:]+$/.test(c)) return null; // alignment row
          return `<${tag}>${renderInline(c)}</${tag}>`;
        }).filter(Boolean).join('');
        return `<tr>${cellHtml}</tr>`;
      };

      const headerRow = renderRow(tableRows[0], 'th');
      const bodyRows = tableRows.slice(2).map(r => renderRow(r, 'td')).join('');

      out.push(`<table class="md-table"><thead>${headerRow}</thead><tbody>${bodyRows}</tbody></table>`);
      continue;
    }
    // Empty line
    else if (trimmed === '') {
      out.push('<br>');
    }
    // Paragraph
    else {
      out.push(`<p>${renderInline(line)}</p>`);
    }
    i++;
  }

  return out.join('\n');
}
