import m from 'mithril';
import stream from 'mithril/stream';

class MainStore {
    who: stream.Stream<string>;
    constructor() {
        this.who = stream();
    }
}

class Hello {
    view(vnode) {
        const store: MainStore = vnode.attrs.store;
        return <h1>Hello {store.who()}!</h1>;
    }
}

class ChangeName {
    view(vnode) {
        const store: MainStore = vnode.attrs.store;
        return <p>Your name: <input onchange={
            (event: Event) => {
                const target = event.target as HTMLInputElement;
                store.who(target.value);
            }
        }
            value={store.who()} /></p>;
    }
}

class NameCountStore {
    counter: stream.Stream<number>;
    constructor(mainstore: MainStore) {
        let count = 0;
        this.counter = mainStore.who.map(() => ++count);
    }
}

class NameCount {
    view(vnode) {
        const store: NameCountStore = vnode.attrs.store;
        return <p>Count of names you have had: {store.counter()}</p>;
    }
}

class NameCountCommentaryStore {
    comment: stream.Stream<string>;
    constructor(nameCountStore: NameCountStore) {
        const comments = ['',
            'Way to be consistent!',
            'That\'s how many moons Mars has.',
            'That\'s how many sides a triangle has.',
            'That\'s a typical number of beats in a measure of music.',
            'Jackson 5 was a great band.'];

        this.comment = nameCountStore.counter.map(count =>
            (count > comments.length) ? 'That\'s a lot of names!' :
                comments[count]);
    }
}

class NameCountCommentary {
    view(vnode) {
        const store: NameCountCommentaryStore = vnode.attrs.store;
        return <p>{store.comment()}</p>;
    }
}

class WidthStore {
    width: stream.Stream<number>;
    constructor() {
        this.width = stream(window.innerWidth);
        window.addEventListener('resize', () => {
            this.width(window.innerWidth);
            m.redraw();
        });
    }
}

const widthStore: WidthStore = new WidthStore();

class MyResponsiveComponent {
    view(vnode) {
        return <p>Window width is {widthStore.width()}</p>;
    }
}

/*
 * Up to this point everything's been a reusable store or Mithril
 * component. Now it's time to tie it all together into an app.
 */

const mainStore = new MainStore();
const nameCountStore = new NameCountStore(mainStore);
const nameCountCommentaryStore =
    new NameCountCommentaryStore(nameCountStore);
mainStore.who('World');

/*
 * Now the main Mithril component connects individual components to
 * their stores. Look at JSX documentation to understand the
 * syntax. If you decide you don't like JSX don't worry, it's easy
 * not to use it. The Mithril documentation eschews it.
 */

class Main {
    view() {
        return <div>
            <Hello store={mainStore} />
            <ChangeName store={mainStore} />
            <NameCount store={nameCountStore} />
            <NameCountCommentary store={nameCountCommentaryStore} />
            <MyResponsiveComponent />
        </div>;
    }
}

/*
 * Finally we start our Mithril app.
 */
console.log('starting...');
m.mount(document.getElementById('app'), Main)
