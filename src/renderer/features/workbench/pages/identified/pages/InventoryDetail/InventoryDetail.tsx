import { Chip } from '@material-ui/core';
import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import IconButton from '@material-ui/core/IconButton';
import EditOutlinedIcon from '@material-ui/icons/EditOutlined';
import DeleteOutlineOutlinedIcon from '@material-ui/icons/DeleteOutlineOutlined';
import { Inventory } from '@api/types';
import { inventoryService } from '@api/services/inventory.service';
import { mapFiles } from '@shared/utils/scan-util';
import { DialogContext, IDialogContext } from '@context/DialogProvider';
import { DIALOG_ACTIONS, InventoryForm } from '@context/types';
import { useDispatch } from 'react-redux';
import { deleteInventory, detachFile, updateInventory } from '@store/inventory-store/inventoryThunks';
import Label from '../../../../components/Label/Label';
import { MATCH_CARD_ACTIONS } from '../../../../components/MatchCard/MatchCard';
import { FileList } from './components/FileList';

export const InventoryDetail = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams<any>();

  const dialogCtrl = useContext(DialogContext) as IDialogContext;

  const [inventory, setInventory] = useState<Inventory>();
  const [files, setFiles] = useState<string[]>([]);

  const getInventory = async () => {
    try {
      const inv = await inventoryService.get({ id });
      setInventory(inv);
      setFiles(mapFiles(inv.files));
    } catch (error) {
      console.error(error);
      navigate(-1);
    }
  };

  const onEditClicked = async () => {
    const inventoryForm: Partial<InventoryForm> = {
      ...inventory,
      id: inventory.id,
      component: inventory.component.name,
      purl: inventory.component.purl,
      version: inventory.component.version,
    };

    // TODO: use recent components
    const nInv = await dialogCtrl.openInventory(inventoryForm);
    if (!nInv) return;

    dispatch(updateInventory(nInv));
    // setInventory(inv);
  };

  const onRemoveClicked = async () => {
    const { action } = await dialogCtrl.openConfirmDialog('Are you sure you want to delete this group?', {
      label: 'Delete',
      role: 'delete',
    });
    if (action === DIALOG_ACTIONS.OK) {
      await dispatch(deleteInventory(inventory.id));
      navigate(-1);
    }
  };

  const onAction = (file: any, action: MATCH_CARD_ACTIONS) => {
    switch (action) {
      case MATCH_CARD_ACTIONS.ACTION_ENTER:
        navigate({
          pathname: `/workbench/detected/file`,
          search: `?path=file|${encodeURIComponent(file.path)}`,
        });
        break;
      case MATCH_CARD_ACTIONS.ACTION_DETACH:
        dispatch(detachFile([file.id]));
        getInventory();
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    getInventory();
  }, []);

  return (
    <>
      <section className="app-page">
        <header className="app-header">
          <div className="identified-info-card">
            <div className="actions">
              <IconButton className="btn-delete" onClick={onEditClicked}>
                <EditOutlinedIcon />
              </IconButton>
              <IconButton className="btn-delete" onClick={onRemoveClicked}>
                <DeleteOutlineOutlinedIcon />
              </IconButton>
            </div>

            <Chip className="identified" variant="outlined" label="Identified Group" />

            <div className="d-flex">
              <div className="info">
                <Label label="COMPONENT" textColor="gray" />
                <h4>{inventory?.component.name}</h4>
              </div>
              <div className="info">
                <Label label="VERSION" textColor="gray" />
                <h4>{inventory?.component.version}</h4>
              </div>
              <div className="info">
                <Label label="LICENSE" textColor="gray" />
                <h4>{inventory?.license_name}</h4>
              </div>
            </div>
            <div className="d-flex">
              <div className="info">
                <Label label="USAGE" textColor="gray" />
                <h4>{inventory?.usage}</h4>
              </div>
              <div className="info">
                <Label label="NOTES" textColor="gray" />
                <span className="notes">{inventory?.notes}</span>
              </div>
            </div>
          </div>
        </header>
        <main className="app-content">
          <FileList files={files} onAction={onAction} />
        </main>
      </section>
    </>
  );
};

export default InventoryDetail;
