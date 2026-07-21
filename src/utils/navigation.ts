import Levenshtein from 'fast-levenshtein';

export interface NavNode {
    name: string;
    slug?: string;
    children: NavNode[];
}

export interface SearchNode {
    name: string;
    slug: string;
}

export function buildNavTree(entries: { id: string; data: { title: string, path: string } }[]): NavNode[] {
    const root: NavNode[] = [];
    
    for (const entry of entries) {
        const parts = entry.id.split('/');
        let currentLevel = root;

        parts.forEach((part, index) => {
            const isLast = index === parts.length - 1;

            let existingNode = currentLevel.find((node) => node.name === part);

            if (!existingNode) {
                existingNode = {
                    name: part,
                    children: [],
                    ...(isLast && {
                        slug: entry.data.path,
                        name: entry.data.title
                    }),
                };
                currentLevel.push(existingNode);
            }

            currentLevel = existingNode.children;
        })
    }

    return root;
}

export function buildSearchList(root: NavNode[]) : SearchNode[] {
    let searchNodes: SearchNode[] = [];
    let stack: NavNode[] = [...root];

    while (stack.length > 0) {
        const node = stack.pop()!;
        const isFolder = node.children && node.children.length > 0;

        if (!isFolder) {
            const outSearchNode: SearchNode = {name: node.name, slug: node.slug!};
            searchNodes.push(outSearchNode);
        } else {
            node.children.forEach((item) => { stack.push(item); });
        }
    }

    return searchNodes;
}

function normalisedLevenshtein(v1: string, v2: string) : number {
    return Levenshtein.get(v1, v2) / Math.max(v1.length, v2.length);
}

function stringDistance(query: string, comparison: string) : number {
    let lev = normalisedLevenshtein(query, comparison);
    if (comparison.startsWith(query)) lev /= 2;
    return lev;
}

export function searchDropdown(dropdown: HTMLElement, value: string, count: number) {
    if (value.length === 0) {
        dropdown.classList.add('search-closed');
    } else {
        dropdown.classList.remove('search-closed');
    }

    interface Entry {
        el: Element;
        d: number;
    }

    const value_lower = value.toLowerCase();

    const entries: Entry[] = Array.from(dropdown.children).map((val) => {
        const entryVal = val.children[0].innerHTML.split('</span>')[1].trim().toLowerCase();
        const dist = stringDistance(value_lower, entryVal);

        const ent: Entry = {el: val, d: dist};
        return ent;
    })

    entries.sort((a, b) => a.d - b.d);
    entries.forEach(entry => dropdown.appendChild(entry.el));

    let counter: number = 0;
    entries.forEach((entry) => {
        // 0 is for jaro-winkler
        if (counter < count && entry.d > 0) {
            entry.el.removeAttribute('hidden');
        } else {
            entry.el.setAttribute('hidden', '');
        }
        counter++;
    })
}