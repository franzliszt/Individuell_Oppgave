"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var core_1 = require("@angular/core");
var forms_1 = require("@angular/forms");
require("rxjs/add/operator/map");
var soknad_1 = require("./soknad");
var kalkulator_1 = require("./kalkulator");
var skjemaservice_1 = require("./skjemaservice");
var SkjemaKontroll = (function () {
    // private service er den som brukes ved kall som går mot api/Bruker.
    function SkjemaKontroll(fb, service) {
        this.fb = fb;
        this.service = service;
        this.skjema = fb.group({
            id: ["", forms_1.Validators.pattern("[0-9]{1,10}")],
            personnummer: ["", forms_1.Validators.pattern("[0-9]{11}")],
            mobiltelefon: ["", forms_1.Validators.pattern("[0-9]{8}")],
            epost: ["", forms_1.Validators.pattern("[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}")],
            belop: [""],
            nedbetalingstid: [""],
            avdrag: [""]
        });
    }
    // Initialiserer nødvendighet.
    SkjemaKontroll.prototype.ngOnInit = function () {
        this.kalkulator = new kalkulator_1.Kalkulator();
        this.settStartverdier();
        this.laster = true;
        this.skjemaStatus = "registrer";
        this.visSkjema = false;
        this.visKalkulator = true;
    };
    SkjemaKontroll.prototype.vedSubmit = function () {
        if (this.skjemaStatus == "registrer") {
            this.lagreSoknad();
        }
        else if (this.skjemaStatus == "endre") {
            this.endreMinSoknad();
        }
        else {
            this.statusmelding("En feil har oppstått." +
                "\nVennligst prøv igjen senere");
        }
    };
    // Viser vinduet for å skrive inn personnummer.
    SkjemaKontroll.prototype.visMinLaneSoknad = function () {
        this.fjern();
        this.nullstill();
        this.settStartverdier();
        this.melding = "";
        this.skjema.patchValue({ personnummer: "" });
        this.visKalkulator = false;
        this.visSkjema = false;
        this.visListe = false;
        this.finnMinSoknad = true;
    };
    // Viser søknadsskjemaet.
    SkjemaKontroll.prototype.tilSkjema = function () {
        this.fjern();
        if (this.skjemaStatus == "registrer") {
            this.nullstill();
        }
        this.finnMinSoknad = false;
        this.visSkjema = true;
        this.visKalkulator = false;
    };
    // Oppdaterer avdrag hver gang slidere endres.
    SkjemaKontroll.prototype.kalkulerAvdrag = function () {
        this.avdrag = this.kalkulator.beregn(this.belop, this.tid);
    };
    // Lagrer en søknad
    SkjemaKontroll.prototype.lagreSoknad = function () {
        var _this = this;
        this.laster = true;
        var soknad = this.opprettSoknad();
        if (soknad.personnummer == "" || soknad.mobiltelefon == "" || soknad.epost == "") {
            this.melding = "Fyll ut alle feltene.";
            this.tomInput = true;
        }
        else {
            this.service.lagreSoknad(soknad).subscribe(function (retur) {
                _this.ok("Søknad lagret med søknadsnummer " + retur.id +
                    ".\nBruk ditt personnummer for å se dine søknader.");
                _this.settStartverdier();
            }, function (error) {
                _this.statusmelding("Klarte ikke å lagre.");
            });
            this.laster = false;
        }
    };
    // Henter en spesifikk søknad som skal endres og fyller ut skjemaet.
    SkjemaKontroll.prototype.visMinSoknad = function (soknad) {
        this.fjern();
        this.skjema.patchValue({ id: soknad.id });
        this.skjema.patchValue({ personnummer: soknad.personnummer });
        this.skjema.patchValue({ mobiltelefon: soknad.mobiltelefon });
        this.skjema.patchValue({ epost: soknad.epost });
        this.belop = soknad.belop;
        this.tid = soknad.nedbetalingstid;
        this.avdrag = soknad.avdragPrMnd;
        this.finnMinSoknad = false;
        this.skjemaStatus = "endre";
        this.visListe = false;
        this.visSkjema = true;
    };
    // Henter alle søknader tilhørende en bruker.
    SkjemaKontroll.prototype.hentMineSoknader = function (pnr) {
        var _this = this;
        if (pnr == "") {
            this.melding = "Vennnligst fyll ut.";
            this.tomInput = true;
        }
        else {
            this.service.hentMineSoknader(pnr).subscribe(function (soknader) {
                _this.oppdaterSoknadsliste(soknader);
                _this.skjemaStatus = "endre";
                _this.visSkjema = false;
                _this.visKalkulator = false;
                _this.finnMinSoknad = false;
                _this.visListe = true;
            }, function (error) {
                _this.tomInput = true;
                _this.skjema.patchValue({ personnummer: "" });
                _this.melding = "Fant ingen informasjon.";
            });
        }
    };
    // Endrer søknad og gjør et kall for å hente oppdatert søknadsliste for en bruker.
    SkjemaKontroll.prototype.endreMinSoknad = function () {
        var _this = this;
        if (this.sjekkInput()) {
            this.tomInput = true;
            this.melding = "Ingen tomme felter.";
        }
        else {
            this.fjern();
            var soknad_2 = this.opprettSoknad();
            soknad_2.id = this.skjema.value.id;
            this.service.endreSoknad(soknad_2)
                .subscribe(function (retur) {
                _this.hentMineSoknader(soknad_2.personnummer);
            }, function (error) {
                _this.statusmelding("Endring av søknad mislyktes.");
            });
        }
    };
    // Sletter en søknad og oppdaterer visningen av søkerens søknader.
    SkjemaKontroll.prototype.slettSoknad = function (id) {
        var _this = this;
        this.service.slettSoknad(id)
            .subscribe(function (retur) {
            if (retur) {
                _this.oppdaterSoknadsliste(retur);
                _this.visSkjema = false;
                _this.finnMinSoknad = false;
                _this.visListe = true;
            }
            ;
        }, function (error) {
            _this.statusmelding("Klarte ikke å slette søknad med søknadsnummer " + id);
        });
    };
    // Startverdier på slidere.
    SkjemaKontroll.prototype.settStartverdier = function () {
        this.belop = 150000;
        this.tid = 5;
        this.kalkulerAvdrag();
    };
    // Hjelpemetode for å hente data fra skjemaet og oppretter en søknad.
    SkjemaKontroll.prototype.opprettSoknad = function () {
        var soknad = new soknad_1.Soknad();
        soknad.personnummer = this.skjema.value.personnummer;
        soknad.mobiltelefon = this.skjema.value.mobiltelefon;
        soknad.epost = this.skjema.value.epost;
        soknad.belop = this.belop;
        soknad.nedbetalingstid = this.tid;
        soknad.avdragPrMnd = this.avdrag;
        return soknad;
    };
    // Oppdaterer et array av søknader.
    SkjemaKontroll.prototype.oppdaterSoknadsliste = function (soknader) {
        this.alleSoknader = [];
        for (var _i = 0, soknader_1 = soknader; _i < soknader_1.length; _i++) {
            var soknad = soknader_1[_i];
            this.alleSoknader.push(soknad);
            this.laster = false;
        }
    };
    // Viser en meldingsboks med informasjon når en operasjon ikke bra.
    SkjemaKontroll.prototype.statusmelding = function (inputFeil) {
        this.finnMinSoknad = false;
        this.visSkjema = false;
        this.visListe = false;
        this.visKalkulator = false;
        this.status = true;
        this.melding = inputFeil;
    };
    // Viser en meldingsboks med informasjon når en operasjon går bra.
    SkjemaKontroll.prototype.ok = function (okMelding) {
        this.finnMinSoknad = false;
        this.visSkjema = false;
        this.visKalkulator = false;
        this.visListe = false;
        this.okBoks = true;
        this.melding = okMelding;
        this.nullstill();
    };
    // Nullstiller skjema.
    SkjemaKontroll.prototype.nullstill = function () {
        this.skjema.patchValue({ id: "" });
        this.skjema.patchValue({ personnummer: "" });
        this.skjema.patchValue({ mobiltelefon: "" });
        this.skjema.patchValue({ epost: "" });
    };
    // Sjekker om noen felter er tomme.
    SkjemaKontroll.prototype.sjekkInput = function () {
        return this.skjema.value.personnummer == "" || this.skjema.value.mobiltelefon == "" ||
            this.skjema.value.epost == "";
    };
    // Avslutter visning av alle søknader og endringsfunksjonalitet og returnerer til lånekalkulatoren.
    SkjemaKontroll.prototype.avbryt = function () {
        this.skjemaStatus = "registrer";
        this.nullstill(); // må endres
        this.settStartverdier();
        this.visSkjema = false;
        this.visListe = false;
        this.visKalkulator = true;
    };
    // Går til oversikten over alle søknader registrert på en kunde.
    SkjemaKontroll.prototype.tilOversikt = function () {
        this.visSkjema = false;
        this.visKalkulator = false;
        this.visListe = true;
    };
    // Sender tilbake til enten kalkulator eller oversikten over søknader avhengig av skjemastatus.
    SkjemaKontroll.prototype.tilbake = function () {
        this.fjern();
        this.skjemaStatus == "endre" ? this.visListe = true : this.visKalkulator, this.settStartverdier();
        this.visListe ? !this.visKalkulator : this.visKalkulator = true, this.visSkjema = false;
        this.finnMinSoknad = false;
        this.status = false;
        this.okBoks = false;
    };
    SkjemaKontroll.prototype.tilKalkulator = function () {
        this.finnMinSoknad = false;
        this.visListe = false;
        this.visSkjema = false;
        this.visKalkulator = true;
    };
    // Fjerner feilmelding ved tomme felter eller ikke registrert.
    SkjemaKontroll.prototype.fjern = function () {
        this.tomInput = false;
        this.melding = null;
    };
    SkjemaKontroll = __decorate([
        core_1.Component({
            selector: "registrering",
            templateUrl: "./app/Registrering.html",
            providers: [skjemaservice_1.SkjemaService],
        }), 
        __metadata('design:paramtypes', [forms_1.FormBuilder, skjemaservice_1.SkjemaService])
    ], SkjemaKontroll);
    return SkjemaKontroll;
}());
exports.SkjemaKontroll = SkjemaKontroll;
//# sourceMappingURL=skjemakontroll.component.js.map