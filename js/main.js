/**
 * <À quand la fibre? __ Trouvez à quelle date la fibre arrivera chez vous, en vous géolocalisant ou en entrant votre adresse.>
*  Copyright (C) <2019>  <Aurélien Caillaud>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

$(function() {

// ------------------------------------Constante principales------------------------------------------
const apiAdresse = 'https://api-adresse.data.gouv.fr/search/?q=';
const apiAdressReverse = 'https://api-adresse.data.gouv.fr/reverse/';
const apiDate1 = 'https://opendata.doubs.fr/api/records/1.0/search/';
const apiDate2 = 'https://opendata.doubs.fr/api/records/1.0/search/';
const url_map = 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png';


// --------------------------------------- Variables utilisées dans les fonctions --------------------

let lati;
let longi;
let coords;
let radius;
let adressePostale;
let adresse = document.getElementById('adresse'),
    suggestions = document.getElementById('suggestions');
let date1;
let date2;
let tempsGagne;


// ------------------------------------ Création de la Map ----------------------------------------
let mymap = L.map('mapid', {
    center: [47.216, 6.5403],
    zoom: 10
});

// ------------------------------------ Appel à API Mapbox et limitation zoom --------------------------
L.tileLayer(url_map, {
    attribution: 'donn&eacute;es &copy; <a href="//osm.org/copyright">OpenStreetMap</a>/ODbL - Tiles courtesy of <a href="https://hot.openstreetmap.org/">Humanitarian OpenStreetMap Team</a>',
    maxZoom: 18,
    id: 'mapbox.streets',
}).addTo(mymap);

// ------------------------------------Fonction de géolocalisation------------------------------------
$("#geoloc").click(function () {
    mymap.locate();
    $('#final').html('');
});

function onLocationFound(e) {
    radius = e.accuracy / 10;
    coords = e.latlng;
    lati = e.latlng.lat;
    longi = e.latlng.lng;
    getAdresse();
    

}

mymap.on('locationfound', onLocationFound);

function onLocationError(e) {
    alert(e.message);
}
mymap.on('locationerror', onLocationError);

// ------------------------------------autocompletion de l'adresse avec API adresse data gouv------------------------------------
(function () {

    let selectedResult = -1, // Permet de savoir quel résultat est sélectionné : -1 signifie "aucune sélection"
        previousRequest, // On stocke notre précédente requête dans cette variable
        previousValue = adresse.value; // On fait de même avec la précédente valeur

    function getResults(keywords) { // Effectue une requête et récupère les résultats

        var xhr = new XMLHttpRequest();
        xhr.open('GET', apiAdresse + encodeURIComponent(keywords));

        xhr.addEventListener('readystatechange', function () {
            if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
                let reponse = xhr.response;
                reponse = JSON.parse(reponse);
                reponse = reponse.features;
                let reponse0 = reponse[0].properties.label;
                let reponse1 = reponse[1].properties.label;
                let reponse2 = reponse[2].properties.label;
                let reponse3 = reponse[3].properties.label;
                let reponse4 = reponse[4].properties.label;
                let reponses = [reponse0, reponse1, reponse2, reponse3, reponse4];
                displayResults(reponses);

            }
        });

        xhr.send(null);

        return xhr;

    }

    function displayResults(reponses) { // Affiche les résultats d'une requête

        suggestions.style.display = reponses.length ? 'block' : 'none'; // On cache le conteneur si on n'a pas de résultats

        if (reponses.length) { // On ne modifie les résultats que si on en a obtenu

            
            var responseLen = reponses.length;

            suggestions.innerHTML = ''; // On vide les résultats

            for (var i = 0, li; i < responseLen; i++) {

                li = suggestions.appendChild(document.createElement('li'));
                li.innerHTML = reponses[i];

                li.addEventListener('click', function (e) {
                    chooseResult(e.target);
                });

            }

        }

    }

    function chooseResult(result) { // Choisi un des résultats d'une requête et gère tout ce qui y est attaché

        adresse.value = previousValue = result.innerHTML; // On change le contenu du champ de recherche et on enregistre en tant que précédente valeur
        suggestions.style.display = 'none'; // On cache les résultats
        result.className = ''; // On supprime l'effet de focus
        selectedResult = -1; // On remet la sélection à "zéro"
        adresse.focus(); // Si le résultat a été choisi par le biais d'un clique alors le focus est perdu, donc on le réattribue

    }

    adresse.addEventListener('keyup', function (e) {

        var lis = suggestions.getElementsByTagName('li');

        if (e.keyCode == 38 && selectedResult > -1) { // Si la touche pressée est la flèche "haut"

            lis[selectedResult--].className = '';

            if (selectedResult > -1) { // Cette condition évite une modification de childNodes[-1], qui n'existe pas, bien entendu
                lis[selectedResult].className = 'result_focus';
            }

        } else if (e.keyCode == 40 && selectedResult < lis.length - 1) { // Si la touche pressée est la flèche "bas"

        suggestions.style.display = 'block'; // On affiche les résultats

            if (selectedResult > -1) { // Cette condition évite une modification de childNodes[-1], qui n'existe pas, bien entendu
                lis[selectedResult].className = '';
            }

            lis[++selectedResult].className = 'result_focus';

        } else if (e.keyCode == 39 && selectedResult > -1) { // Si la touche pressée est "Entrée"

            chooseResult(lis[selectedResult]);

        } else if (adresse.value != previousValue) { // Si le contenu du champ de recherche a changé

            previousValue = adresse.value;

            if (previousRequest && previousRequest.readyState < XMLHttpRequest.DONE) {
                previousRequest.abort(); // Si on a toujours une requête en cours, on l'arrête
            }

            previousRequest = getResults(previousValue); // On stocke la nouvelle requête

            selectedResult = -1; // On remet la sélection à "zéro" à chaque caractère écrit

        }

    });

})();
// ------------------------------------Appel API adresse data gouv lors du clic sur envoyer pour récupérer les coordonnées gps ----------------
$("#envoyer").click(function (e) {
    e.preventDefault();
    // On récupère l'adresse 
    adressePostale = adresse.value;
    $('#final').html('');
    // On appelle la fonction getCoord    
    getCoord();    
    return false;
});


// ------------------------------------Fonction localisation par adresse saisie---------------------------------- 
// ------------------------------------Et ajout du marqueur de postion sur la map et envoie de requête sur opendata doubs-------------------------------------------------------------

function getCoord(){
    $.ajax({
        type: 'GET',
        url: apiAdresse,
        timeout: 2000,
        data: { q: adressePostale },
        dataType: "json",
        success: function(reponse) {
            reponse =reponse.features; // On décompose la réponse pour trouver les éléments ciblés
            reponse = reponse[0];
            reponse = reponse.geometry;
            reponse = reponse.coordinates;
            lati = reponse[1]; // On récupère la lattitude
            longi = reponse[0]; // On récupère la longitude
            // On inverse lat et lng pour créer le marqueur
            reponse = [
                lati,
                longi
            ];
            // On crée le marqueur sur la map
            L.marker(reponse).addTo(mymap)
            .bindPopup("Vous êtes ici " + adressePostale + '<br>latitude : ' + lati + '<br>longitude : ' + longi ).openPopup();
            // On recentre la map
            mymap.setView(
                reponse,
                15
            );
            // On envoie maintenant la requête à opendata
        getDate1();

        },
        error: function() {
        alert('La requête n\'a pas abouti'); }
    });    

}

// -------------------------------------Fonction getAdresse() pour avoir l'adresse à partir des coordonées gps---------------------------------
function getAdresse() {
    $.ajax({
        type: 'GET', 
        url: apiAdressReverse,
        timeout: 2000, 
        data: { lat: lati, lng: longi },
        datatype: "json",
        success: function(data) {
            data = data.features[0].properties.label;
            $('#adresse').val(data);
            // On crée le marqueur sur la map
            L.marker(coords).addTo(mymap)
            .bindPopup("Vous êtes géolocalisé ici "+ data + " avec une marge d'erreur de " + radius + " mètres.<br>Cliquez sur Envoyer pour valider, sinon modifiez l'adresse dans le champ prévu.<br>latitude : "+ lati + "<br>longitude : "+longi ).openPopup();
            L.circle(coords, radius).addTo(mymap);
            // On recentre la map
            mymap.setView(
                coords,
                15
            );
            
            getDate1();
        },
        error: function() {
            alert("La requête n'a pas abouti");
        }
    });
};

// ------------------------------------Recherche des dates dans l'API opendata doubs et comparaison----------------
    // ------------------------------------Recherche de la date de planification actuelle dans l'API opendata doubs----------------

function getDate1() {
    $.ajax({
        type: 'GET',
        url: apiDate1,
        timeout: 2000,
        data: { dataset: 'deploiement-fibre-optique-en-zone-rip-planification-actuelle', facet: 'date', "geofilter.distance": lati +','+ longi },
        datatype: 'json',
        success: function(data1) {
            data1 = data1.records[0];
            if (data1 == undefined) {
                $('#final').html("<p class='reveal-text'>Adresse introuvable dans notre base.<br>Vous ne dépendez pas de la zone gérée par le Départemental du Doubs.</p>");
            } else {
                date1 = data1.fields.date;
                getDate2();
            }
        },
        error: function() {
            alert("La requête n'a pas abouti");
        }
    })
};

    // ------------------------------------Recherche de l'ancienne date de planification dans l'API opendata doubs----------------

function getDate2() {
    $.ajax({
        type: 'GET',
        url: apiDate2,
        timeout: 2000,
        data: { dataset: 'deploiement-fibre-optique-en-zone-rip', facet: 'date', 'geofilter.distance': lati +','+ longi },
        datatype: 'json',
        success: function(data2) {
            date2 = data2.records[0].fields.date;
                // ------------------------------------Comparaison des dates ----------------------------------------------------------
            if ((date1 == '2021-2022') && (date2 > 2022)) {
                tempsGagne = date2 - 2022;
                console.log(date1, date2);
                $('#final').html("<p class='reveal-text'>Vous devriez avoir la fibre chez vous entre 2021 et 2022.<br> Le Département du Doubs vous a fait gagner "+ tempsGagne+ " an(s) sur la date initialement prévue.</p>");
            } else if ((date1 == '2021-2022') && ((date2 == 2021) || (date2 == 2022))) {
                console.log(date1, date2);
                $('#final').text("<p class='reveal-text'>Vous devriez avoir la fibre chez vous entre 2021 et 2022.</p>");
            } else if (date1 < date2) {
                console.log(date1, date2);
                tempsGagne = date2-date1;
                $('#final').html("<p class='reveal-text'>Vous devriez avoir la fibre chez vous en "+ date1+ ".<br> Le Département du Doubs vous a fait gagner "+ tempsGagne+ " an(s) sur la date initialement prévue.</p>");
                
            } else {
                $('#final').html("<p class='reveal-text'>Vous êtes déjà éligible à la fibre depuis "+date1 + ".<br>Rapprochez vous de votre fournisseur d'accès.</p>");
            }
        },
        error: function() {
            alert("La requête n'a pas aboutie");
        }
    })
};

})