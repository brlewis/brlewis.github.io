'use strict';

/** @jsx m */

let planets;
let planetFilter = planet => true;

class PlanetApp {
    view() {
        return (
            <section>
                <PlanetFilters />
                <PlanetTable planets={planets} />
            </section>
        );
    }
}

class PlanetTable {
    view() {
        return (
            <table>
                <tr>
                    <th>Name</th>
                    <th>Composition</th>
                    <th>Moons</th>
                </tr>
            {planets.filter(planetFilter).map(planet => <PlanetRow planet={planet} />)}
            </table>
        );
    }
}

class PlanetRow {
    view(vnode) {
        const { composition, name, moons } = vnode.attrs.planet;
        return (
            <tr>
                <td>{name}</td>
                <td>{composition}</td>
                <td>{moons}</td>
            </tr>
        );
    }
}

class PlanetFilters {
    view(vnode) {
        return (
            <p>
                <PlanetFilter key="All" func={planet => true} />
                <PlanetFilter key="Terrestrial" func={planet => planet.composition === 'terrestrial'} />
                <PlanetFilter key="Gas Giant" func={planet => planet.composition === 'gas giant'} />
                <PlanetFilter key="Ice Giant" func={planet => planet.composition === 'ice giant'} />
            </p>
        );
    }
}

function filterHandler(filterFunction) {
    return function(event) {
        if (event.target.checked) {
            planetFilter = filterFunction;
        }
    };
}
    
class PlanetFilter {
    view(vnode) {
        const { key, func } = vnode.attrs;
        return (
            <label>
                <input type="radio" name="filter" onchange={filterHandler(func)} /> {key}
            </label>
        );
    }
}

m.request({url: 'planets.json'}).then(data => {
    planets = data;
    m.mount(document.getElementById('app'), PlanetApp);
});
