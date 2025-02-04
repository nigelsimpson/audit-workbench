import log from "electron-log";
import { ScannerStage, ScanState } from "../../../../api/types";
import { BaseScannerTask } from "../BaseScannerTask";
import { Scanner } from "../types";
import { modelProvider } from "../../../services/ModelProvider";
import { licenseService } from "../../../services/LicenseService";
import { rescanService } from "../../../services/RescanService";
import { IDispatch } from "../dispatcher/IDispatch";
import { IScannerInputAdapter } from "../adapter/IScannerInputAdapter";

export abstract class RescanTask<TDispatcher extends IDispatch,TInputScannerAdapter extends IScannerInputAdapter> extends BaseScannerTask<TDispatcher,TInputScannerAdapter> {

  public getStageProperties(): Scanner.StageProperties {
    return {
      name: ScannerStage.RESCAN,
      label: 'Rescanning',
      isCritical: true,
    };
  }

  public abstract reScan(): Promise<void>;

  // @Override
  public async set(): Promise<void> {
    await this.project.upgrade();
    this.project.metadata.setScannerState(ScanState.RESCANNING);
    await modelProvider.init(this.project.getMyPath());
    await licenseService.import();
    this.project.save();
  }

  public async done() {
    await this.project.open();
    await this.reScan();
    const results = await rescanService.getNewResults();
    this.project.getTree().sync(results);
    this.project.metadata.setScannerState(ScanState.FINISHED);
    log.info(`%c[ SCANNER ]: Re-scan finished `, 'color: green');
    this.project.save();
  }

}
