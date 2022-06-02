

export class Environment {

  /**  
  * The Azure Digital Twins Host name for the twins which hold the data for vizualization
  * This is loaded from an environment variable named REACT_APP_ADT_HOST. 
  * @returns {string} the host name for the Azure Digital Twins Environment (removes any leading https:// or http://))  
  */
  public static AdtHost = ():string => {
    let adtHost = (process.env.REACT_APP_ADT_HOST ?? "");

    if (adtHost === '[your-host-name]') {
      adtHost = window.location.href;   // Don't crash
    }

    if(adtHost.length === 0)
      console.warn("REACT_APP_ADT_HOST is not set.  This is required for the Azure Digital Twins to work.");

     return adtHost.replace(/^https?:\/\//, '');
  };

  /**  
  * The Blob host url for the blob container which holds the configuration and models for the 3D Scene you want to vizualize.
  * This is from an environment variable named REACT_APP_BLOB_URL. 
  * @returns {string} Blob container url for the Azure Blob Storage Environment 
  */
  public static BlobUrl = ():string =>  {
    let blobUrl = process.env.REACT_APP_BLOB_URL ?? "";
    if (blobUrl === '[your-3d-scenes-storage]') {
      blobUrl = window.location.href;   // Don't crash
    }


    if(blobUrl.length === 0) 
      console.warn("REACT_APP_BLOB_URL is not set.  This is required for the 3D Scene to be loaded.");

    if(!blobUrl.startsWith("https://") && !blobUrl.startsWith("http://"))
      blobUrl = "https://" + blobUrl;

    return blobUrl;
  }; 

}

