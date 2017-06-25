import {Observable} from "rxjs/Observable";
import {AutorizacionFilter} from "../../+dto/autorizacionFilter";
import {Authorization} from "../../+dto/autorizacionResult";
import {LocalStorageGlobal} from "../../+dto/localStorageDto";
import {CurrentUser} from "../../+dto/currentUser";
import {StorageResult} from "../../+dto/storageResult";
import {GeneralTextMask} from "../Utils/generalTextMask";
import {ExpressionRegularValidate} from "../Utils/expressionRegularValidate";
import {Message} from "primeng/components/common/api";
import {IUrlOptions, RequestTypes} from "../../+rest/backend.model";
import {BackendService} from "../../+rest/backend.service";




/**
 * Created by javier.cuicapuza on 1/18/2017.
 */

declare var $: any;
export class ComponentBase {

    protected showLoading: boolean;


    protected errorMessage: string;
    protected mensaje:string;
    moduleCode: string;
    protected currentUser: CurrentUser;
    private authorizationList: boolean[]=[];
    private localStorageValue: LocalStorageGlobal = new LocalStorageGlobal();
    authorizationFilter: AutorizacionFilter = new AutorizacionFilter();
    private roles: boolean[]=[];
    protected storageCommomnValueResult: StorageResult = new StorageResult();
    protected blockedUI: boolean;


    protected fncEstadoTiempoBool: boolean;

    urlAutocompleteEmpleado:string =  '/autocomplete/autocompleteEmpleado?search=';

    urlAutocompleteJefe:string =  '/autocomplete/autocompleteJefe?search=';
    urlAutocompleteEmpleadoConJefe:string =  '/autocomplete/autocompleteEmpleadoConJefe?idJefe=';

    urlUploadFile:string = '/utility/cargarArchivoDocumento';
    urlRemoveFile:string = '/utility/eliminarArchivoDocumento';
    urlDowloadFile:string = '/utility/descargarArchivoDocumento';

    urlExportEmpleado:string =  '/utility/exportarEmpleados';
    urlExportBusquedaRapidaEmpleado:string =  '/utility/exportarBusquedaRapidaEmpleados';

    urlExportVacaciones:string =  '/utility/exportarVacaciones';
    urlExportBusquedaRapidaVacaciones:string = '/utility/exportarBusquedaRapidaVacaciones';
    urlExportVacacionesPendientes:string =  '/utility/exportarVacacionesPendientes';
    urlExportVacacionesPlanilla:string =  '/utility/exportarVacacionesPlanilla';

    urlUploadImportEmpleado:string = '/utility/importarArchivoEmpleados';

    urlRemoveImportEmpleado:string = '/utility/eliminarArchivoEmpleados';

    urlTemplateEmpleado:string = '/utility/templateEmpleadosProcess';

    urlDowloadTemplateEmpleado:string = '/utility/descargarTemplateEmpleados';

    urlDowloadFileJasper:string = '/utility/descargarContrato';

    urlExportMarcacion:string = '/utility/exportarMarcaciones';
    urlExportBusquedaRapidaMarcacion:string = '/utility/exportarBusquedaRapidaMarcaciones';

    urlExportLicencia:string = '/utility/exportarLicencias';
    urlExportBusquedaRapidaLicencia:string = '/utility/exportarBusquedaRapidaLicencias';

    urlExportPeriodo:string =  '/utility/exportarPeriodoEmpleado';

    constructor(public backendService: BackendService,
                public codigoModulo: string){
        this.storageCommomnValueResult = JSON.parse(localStorage.getItem('sharedSession'));
        this.retrieveCurrentUser();
        this.moduleCode = codigoModulo;
        this.authorizationFilter.idUsuario = this.currentUser.idUsuario;
        this.authorizationFilter.codigoModulo = this.moduleCode;
        this.retrieveCurrentAuthorization();
    }

    private retrieveCurrentUser(){

        this.currentUser = JSON.parse(localStorage.getItem("sessionId") || '{}');

        this.currentUser.assignedRoles.forEach((item)=>{
            this.roles[item.roleName]  = item.assigned;
        });
    }

    private retrieveCurrentAuthorization(){
        if(sessionStorage.getItem(this.moduleCode) == null){

            Observable.forkJoin(
                this.autorizacionByUsuario(this.authorizationFilter)
            ).subscribe(
                data => {
                    sessionStorage.setItem(this.moduleCode,JSON.stringify(data[0]));
                    let list : Authorization[] = JSON.parse(sessionStorage.getItem(this.moduleCode));
                    list.forEach((item)=>{
                        this.authorizationList[item.actionName]  = item.authorized;
                    });
                },
                error => this.errorMessage = <any>error);

        }else{
            let list : Authorization[] = JSON.parse(sessionStorage.getItem(this.moduleCode));
            list.forEach((item)=>{
                this.authorizationList[item.actionName]  = item.authorized;
            });
        }

    }

    protected hasAuthorization(moduleCode: string, actionName: string):boolean{
        if (sessionStorage.getItem(moduleCode) != null) {
            let sessionList: Authorization[] = JSON.parse(sessionStorage.getItem(moduleCode));
            for (let list of sessionList) {
                if (list.actionName == actionName) {
                    return list.authorized;
                }
            }
        }
        return false;
    }

    protected isAuthorized(actionName: string):boolean{
        return this.authorizationList[actionName];
    }

    protected storeAuthorizationByModuleCode(moduleCode: string){
        if(sessionStorage.getItem(moduleCode) == null){
            let filter: AutorizacionFilter = new AutorizacionFilter();
            filter.codigoModulo = moduleCode;
            filter.idUsuario    = this.currentUser.idUsuario;
            Observable.forkJoin(
                this.autorizacionByUsuario(filter)
            ).subscribe(
                data => {
                    sessionStorage.setItem(moduleCode,JSON.stringify(data[0]));
                },
                error => this.errorMessage = <any>error);
        }
    }

    /*protected hasRole(roleName: string):boolean{
     return this.roles[roleName];
     }*/
    /*NgClass*/
    protected getAuthorizationClass(actionName: string, controlType: string){
        let setClass;
        setClass = {
            'hide-column-grid': true
        }
        return setClass;
    }

    protected getEditableClass(actionName: string){
        let setClass;

        if(this.authorizationList[actionName]){
            setClass = {
                'input': true
            }

        }else {
            setClass = {
                'input': true,
                'state-disabled': true
            }
        }
        return setClass;
    }

    protected autorizacionByUsuario(autorizacionFilter: AutorizacionFilter) {
        let urlOptions: IUrlOptions = <IUrlOptions>{};
        urlOptions.restOfUrl = '/api/rol/obtenerAutorizacion';
        return this.backendService.AuthRequest(RequestTypes.post, urlOptions,JSON.stringify(autorizacionFilter)).map(res => <Authorization[]> res)
            .catch(err=> this.backendService.handleError(err));
    }

    protected isAuthorizationByRole(idUsuario:number, moduleCode: string, actionName: string) {
        let urlOptions: IUrlOptions = <IUrlOptions>{};
        urlOptions.restOfUrl = '/login/validateModuleActionName?idUsuario=';
        return this.backendService.AuthRequest(RequestTypes.get, urlOptions,idUsuario+'&moduleCode='+moduleCode+'&actionName='+actionName)
            .map(res => <Boolean> res)
            .catch(err=> this.backendService.handleError(err));
    }

    public validaEnter(e) {

        //$('input[type=text]').keypress(function (e) {
        if ((e.which && e.which == 13) || (e.keyCode && e.keyCode == 13)) {
            $('button[type=submit]').click();
            return false;
        } else {
            return true;
        }
        //});

    }

    protected fncEstadoTiempoCargoDelete(dataItem: any){
        let fechaAct:Date = new Date();
        let fechaDesde = dataItem.fechaInicio;
        let fechaHasta = dataItem.fechaFin;
        let cadenaInicio:string[] = fechaDesde.split('/');
        let fechaInicio:Date = new Date( parseInt(cadenaInicio[2]),parseInt(cadenaInicio[1])-1,parseInt(cadenaInicio[0]));

        let fechaFin:Date;
        if(fechaHasta!=null){
            let cadenaFin:string[] = fechaHasta.split('/');
            fechaFin = new Date( parseInt(cadenaFin[2]),parseInt(cadenaFin[1])-1,parseInt(cadenaFin[0]));
        }
        if(fechaInicio>fechaAct){
            this.fncEstadoTiempoBool = true;
        }else if(fechaFin<fechaAct && fechaInicio<fechaAct && fechaFin!=null){
            this.fncEstadoTiempoBool = false;
        }else if(fechaInicio<fechaAct || fechaFin == null || fechaFin>fechaAct){
            this.fncEstadoTiempoBool = false;

        }
        return this.fncEstadoTiempoBool;
    }

    /*Stars - Implement mask on input Date*/
    public dateTimeMask = GeneralTextMask.datetimeMask;
    public currencyMask = GeneralTextMask.currencyMask;
    public inputDatePickerFecha: string;
    public inputDateInicioDatePicker: string;
    public inputDateFinDatePicker: string;
    public isValidadCharacterDate: boolean;
    msgs: Message[] = [];

    public keyUpLenghtInput($event){
        if ($event.target.value.length == 10) {
            this.isValidadCharacterDate = true;
        }
    }
    public keyUpLenghtTwoCaracters($event){
        if ($event.target.value.length == 2) {
            this.isValidadCharacterDate = true;
        }
    }
    protected searchDateParameter(){}
    protected cleanGridView(){}

    public dateModelChangeFechaBoolean(value){
        var lenghtInputDate = value.length;
        if (lenghtInputDate == 10) {
            if(this.validateInputDate(value)){
                this.isValidadCharacterDate = true;
                this.inputDatePickerFecha = value;
                this.searchDateParameter();
            }
        }
    }
    public dateModelChangeInicioBoolean(value){
        var lenghtInputDate = value.length;
        if (lenghtInputDate == 10) {
            if(this.validateInputDateInicio(value)){
                this.isValidadCharacterDate = true;
                this.inputDateInicioDatePicker = value;
                this.searchDateParameter();
            }
        }
    }

    public dateModelChangeFinBoolean(value){
        var lenghtInputDate = value.length;
        if (lenghtInputDate == 10) {
            if(this.validateInputDateFin(value)){
                this.isValidadCharacterDate = true;
                this.inputDateFinDatePicker = value;
                this.searchDateParameter();
            }
        }
    }

    public keyUpLenghtNotNull($event,idControl){
        if ($event.target.value.length != 0) {
            this.validateKeyUpLenghtNotNull($event,idControl);
        }
    }

    public onModelChangeDatePickerInput(value,idControl){
        var lenghtInputDate = value.length;
        if (lenghtInputDate == 10) {
            if(this.validateOnModelChangeDatePicker(value,idControl)){
                this.isValidadCharacterDate = true;
                this.inputDateInicioDatePicker = value;
            }
        }
    }

    private validateInputDate(value): boolean{
        let validateFormat = value ===undefined ? true : ExpressionRegularValidate.isValidateDateInput(value);
        if(!validateFormat){
            this.msgs.push({severity:'error', summary:'Runakuna Error', detail:'Ingrese una Fecha valida'});
            $('#datepickerFecha').addClass('invalid').removeClass('required');
            $('#datepickerFecha').parent().addClass('state-error').removeClass('state-success');
            this.cleanGridView();
            return;
        }
        return true;
    }

    private validateOnModelChangeDatePicker(value,idControl): boolean{
        let validateFormat = value ===undefined ? true : ExpressionRegularValidate.isValidateDateInput(value);
        if(!validateFormat){
            this.msgs.push({severity:'error', summary:'Runakuna Error', detail:'Ingrese una Fecha v\u00e1lida'});
            $('#'+idControl).addClass('invalid').removeClass('required');
            $('#'+idControl).parent().addClass('state-error').removeClass('state-success');
            this.cleanGridView();
            return;
        }else{
            $('#'+idControl).removeClass('state-error');
            $('#'+idControl).parent().removeClass('state-error');
        }
        return true;
    }

    private validateKeyUpLenghtNotNull($event,idControl): boolean{
        let validate = $event;
        if(!validate){
            this.msgs.push({severity:'error', summary:'Runakuna Error', detail:'Ingrese una Fecha valida'});
            $('#'+idControl).addClass('invalid').removeClass('required');
            $('#'+idControl).parent().addClass('state-error').removeClass('state-success');
            return;
        }else{
            $('#'+idControl).removeClass('state-error');
            $('#'+idControl).parent().removeClass('state-error');
        }
        return true;
    }

    private validateInputDateInicio(value): boolean{
        let validateFormat = value ===undefined ? true : ExpressionRegularValidate.isValidateDateInput(value);
        if(!validateFormat){
            this.msgs.push({severity:'error', summary:'Runakuna Error', detail:'Ingrese una Fecha valida'});
            $('#datepickerDesde').addClass('invalid').removeClass('required');
            $('#datepickerDesde').parent().addClass('state-error').removeClass('state-success');
            $('#datepickerDesdeAdvance').addClass('invalid').removeClass('required');
            $('#datepickerDesdeAdvance').parent().addClass('state-error').removeClass('state-success');
            this.cleanGridView();
            return;
        }else{
            $('#datepickerDesde').removeClass('state-error');
            $('#datepickerDesde').parent().removeClass('state-error');
            $('#datepickerDesdeAdvance').removeClass('state-error');
            $('#datepickerDesdeAdvance').parent().removeClass('state-error');
        }
        return true;
    }

    private validateInputDateFin(value): boolean{
        let validateFormat = value ===undefined ? true : ExpressionRegularValidate.isValidateDateInput(value);
        if(!validateFormat){
            this.msgs.push({severity:'error', summary:'Runakuna Error', detail:'Ingrese una Fecha valida'});
            $('#datepickerHasta').addClass('invalid').removeClass('required');
            $('#datepickerHasta').parent().addClass('state-error').removeClass('state-success');
            $('#datepickerHastaAdvance').addClass('invalid').removeClass('required');
            $('#datepickerHastaAdvance').parent().addClass('state-error').removeClass('state-success');
            this.cleanGridView();
            return;
        }else{
            $('#datepickerHasta').removeClass('state-error');
            $('#datepickerHasta').parent().removeClass('state-error');
            $('#datepickerHastaAdvance').removeClass('state-error');
            $('#datepickerHastaAdvance').parent().removeClass('state-error');
        }
        return true;
    }

    calculateAge(value:String):number{

        if(value === undefined || value == null || value ==''){
            return null;
        }
        let fechaNac:string[]= value.split('/');

        let birthday:Date = new Date(parseInt(fechaNac[2]),parseInt(fechaNac[1])-1,parseInt(fechaNac[0]));

        let today:Date = new Date();

        let years:number = today.getFullYear() - birthday.getFullYear();
        birthday.setFullYear(today.getFullYear());

        if (today < birthday)
        {
            years--;
        }

        return years;
    }

    public validNumerico(e) {

        //$('input[type=text]').keypress(function (e) {
        if ((e.which && e.which >= 48 && e.which <= 57) || (e.keyCode && e.keyCode >= 48 && e.keyCode <= 57)) {

            return true;
        } else {
            return false;
        }
        //});

    }




}
