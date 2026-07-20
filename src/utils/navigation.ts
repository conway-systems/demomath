export interface NavNode {
    name: string;
    slug?: string;
    children: NavNode[];
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