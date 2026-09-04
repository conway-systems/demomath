import { marked } from 'marked';
import { gfmHeadingId } from 'marked-gfm-heading-id';
marked.use(gfmHeadingId());


class WikiMarker {
  public label: string = "";
  public anchor: string = "";
  public indent: number = 0;

  constructor(label: string, anchor: string, indent: number) {
    this.label = label;
    this.anchor = anchor;
    this.indent = indent;
  }

  public get_html() : string {
    let per_indent: string = "10px";

    return `
    <a href="#${this.anchor}">
      <div class="marker">
        <p style="margin-left: calc(${this.indent} * ${per_indent});">${this.label}</p>
      </div>
    </a>
      `
  }
}

class WikiRow {
  cols: Array<string> = [];

  constructor(cols: Array<string>) {
    this.cols = cols;
  }
  
  add_child(child: string) {
    this.cols.push(child);
  }

  public get_html() : string {
    // iterate over each item and append it's innerhtml as a column div

    return `
    <div class="columns-container">
      ${
        ((cols: Array<string>) => {
          let out: string = "";

          cols.forEach((value) => {
            out += `
            <div class="column">
              ${value}
            </div>
            `
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
  markers: Array<WikiMarker> = [];
  cols: Array<WikiRow> = [];

  constructor(title: string, markers: Array<WikiMarker>, cols: Array<WikiRow>) {
    this.title = title;
    this.markers = markers;
    this.cols = cols;  
  }

  public get_nav_html() {
    return `<h2>${this.title}</h2>`;
  }

  public get_markers_html() {
    let html: string = "";
    this.markers.forEach((marker) => {
      html += marker.get_html();
    })
    return html;
  }

  public get_inner_html() {
    let out: string = "";

    this.cols.forEach((value) => {
      out += value.get_html();
    })

    return out;
  }
}

function stringToAnchor(str: string) : string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')  // remove non word characters
    .replace(/[\s_-]+/g, '-')  // replace spaces/underscores with a dashes
    .replace(/^-+|-+$/g, '');  // trim leading/trailing dashes
}

export class demoscript {
  static parse(text: String) : WikiParsed {
    //text = text.replaceAll("\r\n", "\n");
    text = text.replaceAll("\r", "");

    let title: string = "";
    let markers: Array<WikiMarker> = [];
    let rows_arr: Array<WikiRow> = [];


    // scanning for title
    // don't need to scan for carriage returns, theyve been stripped
    let split = text.split(/\n/);
    let content_offset: number = 0;
    // using some for early returns
    // blame stackoverflow
    split.some((item) => {
      if (item.length == 0) {
        content_offset++;
        return false;
      } else {
        title = item;
        return true;
      }
    });
    if (title == "") throw "Could not find any text to make a title"
    content_offset += title.length;
    
    // take whats after title and strip beginning newlines
    let content_text: string = text.substring(content_offset)
                                   .replace(/^\n+/, "");
    

    // ugh
    // matches the beginning or :::, and matches the end or :::
    let row_regex = /(?:(?<=^|\n)(?<!\\):::\n?|^)([\s\S]+?)(?=\n?(?<!\\):::|$)/g;

    //let col_regex = /^\|\|\|\n([\s\S]*?)\n(?<!\\)\|\|\|/gm;
    content_text.matchAll(row_regex).forEach((value) => {
      // take only the inner capture
      let row: WikiRow = new WikiRow([]);

      let row_split = value[1].split(/(?<=^|\n)(?<!\\)\|\|\|\n*/);
      row_split.forEach((value) => {
        row.add_child(
          marked.parse(value).toString()
        );
      })

      rows_arr.push(row);
    })


    //console.log(rows_arr);


    // scanning for markers
    let markers_regex = /^\#+.+/gm;
    content_text.matchAll(markers_regex).forEach((value) => {
      //console.log(value[0]);
      let label = value[0].replace(/^\#+\s*/, "");
      //console.log(label);
      let indent_level = value[0].match(/^\#+/)![0].length;
      //console.log(indent_level);
      let anchorified = stringToAnchor(value[0]);
      //console.log(anchorified);

      markers.push( new WikiMarker(label, anchorified, indent_level) );
    });


    //console.log(markers);
    let out: WikiParsed = new WikiParsed(title, markers, rows_arr);


    return out;
  }
}








// just a temporary function for now
// until the api is set up
export function fetch_wiki_entry(id: string) : string {
  return `
test title

# heading 1

:::
this is separated
|||
\\|||
into columns
:::

## heading 2

:::
this is also
separated into
columns, but 3
|||
i dont know what to put in this box



yeah
|||
images!

it **should** follow the markdown spec, other than the obvious sectioning
![Example image](https://thumb.wikimedia.org/wikipedia/commons/thumb/3/34/Cape_Otway_%28AU%29%2C_Cape_Otway_Lighthouse%2C_Telegraph_Station_--_2019_--_1179.jpg/1280px-Cape_Otway_%28AU%29%2C_Cape_Otway_Lighthouse%2C_Telegraph_Station_--_2019_--_1179.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail "A house")
:::

# heading 3
this is not separated into columns!

hopefully, the columns should automatically arrange themselves by size
and by device size, but it isn't really a guaranteed yet 
  `;
}