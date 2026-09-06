import { marked } from 'marked';
// adds ID fields to headers
import { gfmHeadingId, getHeadingList, resetHeadings } from 'marked-gfm-heading-id';
// latex rendering
import markedKatex from 'marked-katex-extension';

import DOMPurify from 'isomorphic-dompurify';

marked.use(gfmHeadingId({ globalSlugs: true } as { prefix?: string; globalSlugs?: boolean }));
marked.use(markedKatex({ throwOnError: false }));

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  })[character] ?? character);
}

function validWidth(value: string | undefined): string | null {
  if (!value || !/^(?:0|\d+(?:\.\d+)?(?:px|%|vw|vh|rem|em|fr))$/.test(value)) {
    return null;
  }
  return value;
}


class WikiMarker {
  label: string = "";
  anchor: string = "";
  indent: number = 0;

  constructor(label: string, anchor: string, indent: number) {
    this.label = label;
    this.anchor = anchor;
    this.indent = indent;
  }

  public get_html() : string {
    let per_indent: string = "10px";

    return `
    <a href="#${escapeHtml(this.anchor)}">
      <div class="marker">
        <p style="margin-left: calc(${this.indent} * ${per_indent});">${escapeHtml(this.label)}</p>
      </div>
    </a>
      `
  }
}

class WikiCol {
  value: string = "";
  width: string = "0";

  constructor(value: string, width?: string | null) {
    this.value = value;
    if (width)
      this.width = width;
  }

  public get_html() : string {
    return `
    <div class="column" style="
      flex: ${this.width == "0" ? "1" : "0"} ${this.width == "0" ? "1" : "0"} ${this.width};
    ">
      ${this.value}
    </div>
    `
  }
}

class WikiRow {
  cols: Array<WikiCol> = [];

  constructor(cols: Array<WikiCol>) {
    this.cols = cols;
  }
  
  add_child(child: WikiCol) {
    this.cols.push(child);
  }

  public get_html() : string {
    // iterate over each item and append it's innerhtml as a column div

    return `
    <div class="columns-container">
      ${
        ((cols: Array<WikiCol>) => {
          let out: string = "";

          cols.forEach((value) => {
            out += value.get_html();
          })

          return out;
        })(this.cols)
      }
    </div>
    `
  }
}

export class WikiParsed {
  title: string = "";
  topic: string = "";
  markers: Array<WikiMarker> = [];
  cols: Array<WikiRow> = [];

  constructor(title: string, topic: string, markers: Array<WikiMarker>, cols: Array<WikiRow>) {
    this.title = title;
    this.topic = topic;
    this.markers = markers;
    this.cols = cols;  
  }

  public get_nav_html() {
    return DOMPurify.sanitize(`
    <h2>${escapeHtml(this.title)}</h2>
    <h3>${escapeHtml(this.topic)}</h3>
    `);
  }

  public get_markers_html() {
    let html: string = "";
    this.markers.forEach((marker) => {
      html += marker.get_html();
    })
    return DOMPurify.sanitize(html);
  }

  public get_inner_html() {
    let out: string = "";

    this.cols.forEach((value) => {
      out += value.get_html();
    })

    return DOMPurify.sanitize(out);
  }
}

export class demoscript {
  static parse(text: string) : WikiParsed {
    text = text.replaceAll("\r", "");
    resetHeadings();

    let title: string = "no title provided";
    let topic: string = "no topic provided";
    let markers: Array<WikiMarker> = [];
    let rows_arr: Array<WikiRow> = [];


    // scanning for title
    // don't need to scan for carriage returns, theyve been stripped
    //let split = text.split(/\n/);
    let content_offset: number = 0;
    
    // take whats after title and strip beginning newlines
    let content_text: string = text.substring(content_offset)
                                   .replace(/^\n+/, "");
    

    // ugh
    // matches the beginning or :::, and matches the end or :::
    // include the leading \n since it is needed for the arguments
    let row_regex = /(?:(?<=^|\n)(?<!\\):::|^)(\n?[\s\S]+?)(?=\n(?<!\\):::[^\n]*(?:\n|$)|$)/g;

    content_text.matchAll(row_regex).forEach((value, index1) => {
      // take only the inner capture
      let row: WikiRow = new WikiRow([]);

      let row_split = value[1].split(/(?<=^|\n)(?<!\\)\|\|\|/);
      row_split.forEach((value, index2) => {

        // take the first line for arguments (this follows the ||| or :::)
        let line1 = (() => {
          let tmp_split = value.split("\n", 1);
          if (tmp_split.length == 1) 
            return tmp_split[0];
          return "";
        })();

        // match everything like blah=blah
        // must begin with a word
        // let args_regex = /\w+\s*=\s*("[^"]*"|'[^']*'|.+?)(?=\s+\w+\s*=|$)/g;
        let args_regex = /\w.+?\=\s*("[^"]*"|'[^']*'|[^,\n]+)/g;
        let args_strs = line1.matchAll(args_regex).toArray().map((value) => value[0].trim().toString());
        let args: Map<string, string> = new Map();

        args_strs.forEach((value) => {
          let key = value.split("=")[0];
          // trims past the equals, replaces beginning quote and end quote
          let v = value.substring(key.length+1).trim().replace(/^["']|["']$/g, "");;
          
          args.set(key.trim(), v);
        });

        // checking against the width entry in args
        // sorry this is a useless comment
        let width: string | null = (() : string | null => {
          return validWidth(args.get("width"));
        })();



        // Getting details for the header
        // title, topic (to later be subtitle and links)
        if (index1 == 0 && index2 == 0) {
          let title_str = args.get("title");
          title_str ? title = title_str : console.warn("no topic provided");

          let topic_str = args.get("topic");
          topic_str ? topic = topic_str : console.warn("no topic provided");
        }



        let col = new WikiCol(
          DOMPurify.sanitize(marked.parse(value.substring(line1.length)).toString()),
          width
        );
        row.add_child( col );
      })

      rows_arr.push(row);
    })



    getHeadingList().forEach((heading) => {
      markers.push(new WikiMarker(heading.raw, heading.id, heading.level));
    });

    let out: WikiParsed = new WikiParsed(title, topic, markers, rows_arr);


    return out;
  }
}








// just a temporary function for now
// until the api is set up
export function fetch_wiki_entry(id: string) : string {
  return `
title=test title, topic='test', subtopic="te,st\\""

# heading 1

:::
this is separated
||| width=30%
\\|||
into columns

this one is _30% wide_
:::

## heading 2

:::
this is also
separated into
columns, but 3
|||
i dont know what to put in this box



yeah
||| width=700px
images! (this column is _700px wide_)

it **should** follow the markdown spec, other than the obvious sectioning
![Example image](https://thumb.wikimedia.org/wikipedia/commons/thumb/3/34/Cape_Otway_%28AU%29%2C_Cape_Otway_Lighthouse%2C_Telegraph_Station_--_2019_--_1179.jpg/1280px-Cape_Otway_%28AU%29%2C_Cape_Otway_Lighthouse%2C_Telegraph_Station_--_2019_--_1179.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail "A house")
:::
---

# heading 3
::: width=50vw
this is not separated into columns!

$$\\Gamma(s)=\\int_0^\\infty x^{s-1}e^{-x} \\text dx$$

hopefully, the columns should automatically arrange themselves by size
and by device size, but it isn't really a guaranteed yet 
:::`;
}