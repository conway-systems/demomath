interface GraphExtent {
    xMin: number;
    xMax: number;
}

interface GraphData {
    values: number[];
}

interface ExpressionData {
    id: string;
    rawExpression: string;
    compiledFn: ((x: number) => number) | null;
    color: string;
    graphedExtent: GraphExtent;
}


export class ExpressionManager {
    private store: Map<string, ExpressionData> = new Map<string, ExpressionData>;
    private container: HTMLElement;
    private maxId: number = 0;

    constructor(_expressionContainer: HTMLElement) {
        this.container = _expressionContainer;
    }

    formatExpression(id: string, raw: string) : HTMLElement {
        const innerHTML = `
        <div class="expression-left">

        </div>
        <div class="expression-content">
            <input value="${raw}" placeholder="type something..." class="expression-input">
            </input>
        </div>
        `;

        let expr: HTMLElement = document.createElement("div", );
        expr.innerHTML = innerHTML;
        expr.classList.add("expression")
        expr.id = id;

        console.log(expr);
        return expr;
    }

    public addExpression(id: string) {
        this.container.appendChild( this.formatExpression(id, "") );
    }

    public genExpressionID() : string {
        const out: string = `expression-id-${this.maxId.toString(16)}`;
        this.maxId++;
        return out;
    }

    public getExpression(id: string) : ExpressionData | null {
        return null;
    }

    public compileExpression(expression: ExpressionData) : ((x: number) => number) {
        return (function (x: number) { return x; });
    }
}


export class GraphManager {
    private canvas: HTMLCanvasElement;

    constructor(_canvas: HTMLCanvasElement) {
        this.canvas = _canvas;
    }

    
}