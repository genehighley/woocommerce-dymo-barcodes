jQuery( function( $ ) {

    // wcb_params is required to continue, ensure the object exists
    if ( typeof wcb_params === 'undefined' ) {
        return false;
    }

    var label, labelSet, labelSize,
        stock = 1;

    /**
     * init
     */
    function dymoInit() {
        dymoCheckEnvironment();
        dymoLoadLabel();
        dymoLoadPrinters();
    }

    /**
     * Check that Dymo plugin is installed and browser is supported
     *
     * @return {string} error message
     */
    function dymoCheckEnvironment() {
        var checkEnvironment = dymo.label.framework.checkEnvironment();
        if ( !checkEnvironment.isFrameworkInstalled || !checkEnvironment.isBrowserSupported ) {
            if ( $( 'body' ).hasClass( 'product_page_product_barcodes' ) ) {
                $( '.wrap' ).find( 'h2' ).after( '<div class="error"><p>' + checkEnvironment.errorDetails + ' ' + wcb_params.i18n_need_help + '</p></div>' );
            }
        }
    }

    /**
     * load Dymo label data
     */
    function dymoLoadLabel() {
        var labelSize = wcb_params.label_size,
            $printerList = $( '#woocommerce_product_barcodes_label_size' );

        if ( $printerList.length ) {
            labelSize = $printerList.val();
        }

        dymoGetLabel( labelSize );
    }

    /**
     * Get a list of installed Dymo label printers
     * 
     * @return {string}
     */
    function dymoLoadPrinters() {
        var printers = dymo.label.framework.getLabelWriterPrinters();

        console.log(printers);

        if ( typeof printers === 'undefined' || printers.length === 0 ) {
            return;
        }

        for ( var i = 0; i < printers.length; ++i ) {
            var printer = printers[ i ];

            $( '<option>' ).val( printer.modelName ).text( printer.name ).appendTo( '#woocommerce_product_barcodes_dymo_printer' );
        }
    }

    /**
     * Get label data
     * 
     * @param  {string} size
     */
    function dymoGetLabel( size ) {
        $.get( wcb_params.plugin_url + '/assets/labels/' + size + '.label', function( labelXml ) {
            label = dymo.label.framework.openLabelXml( labelXml );
            dymoRenderLabel();
            dymoPrintPreview();
        }, "text" );
    }

    /**
     * Print label
     * 
     * @param  {object} data
     * @param  {object} event
     * @return {void}
     */
    function dymoPrintLabel( data ) {
        var printers = dymo.label.framework.getLabelWriterPrinters();
        var checkEnvironment = dymo.label.framework.checkEnvironment();
        try {
            if ( !checkEnvironment.isFrameworkInstalled || !checkEnvironment.isBrowserSupported ) {
                throw checkEnvironment.errorDetails;
            }
            if ( printers.length === 0 ) {
                throw wcb_params.i18n_no_printers_error;
            }
            if ( !label ) {
                throw wcb_params.i18n_label_loaded_error;
            }
            if ( !labelSet ) {
                throw wcb_params.i18n_data_loaded_error;
            }
            // print label
            label.print( wcb_params.dymo_printer, null, data );
        } catch ( e ) {
            alert( e.message || e );
        }
    }

    /**
     * Create label set
     *
     * @return {void}
     */
    function dymoCreateLabelSet() {
        var labelSet = new dymo.label.framework.LabelSetBuilder();

        $( '.wcb_barcodes' ).each( function( index, value ) {
            var $variation = $( this ),
                name = $variation.find( 'input.product-name' ).val(),
                barcode = $variation.find( 'input.product-barcode' ).val(),
                metadata = $variation.find( 'input.product-metadata' ).val(),
                stock = $variation.find( 'input.product-label-input' ).val();

            for ( var i = 0; i < stock; i++ ) {
                var record = labelSet.addRecord();
                record.setText( 'product_name', name );
                record.setText( 'metadata', $.trim( metadata ) );
                record.setText( 'product_barcode', barcode );
            }
        } );

        return labelSet;
    }

    /**
     * Display updated label preview
     *
     * @return {string}
     */
    function dymoPrintPreview() {
        $( '#woocommerce-dymo-print-preview-img' ).attr( 'src', 'data:image/png;base64,' + label.render() );
    }

    /**
     * Render label from meta data
     *
     * @return {void}
     */
    function dymoRenderLabel() {
        var metadata = $( '.metadata:checked' ).map( function() {
            return $.trim( $( this ).parent().text() );
        } ).get().join( ' ' );

        var name = $( '.name:checked' ).map( function() {
            return $.trim( $( this ).parent().text() );
        } ).get().join( ' ' );

        var barcode = $( '.barcode:checked' ).map( function() {
            return $.trim( '1234' );
        } ).get().join( ' ' );

        label.setObjectText( 'metadata', metadata );
        label.setObjectText( 'product_name', name );
        label.setObjectText( 'product_barcode', barcode );
    }

    // load label and defaults
    $( window ).on( 'load', dymoInit );

    // change preview label size
    $( document ).on( 'change', '#woocommerce_product_barcodes_label_size', function() {
        var labelSize = $( this ).val();
        dymoGetLabel( labelSize );
    } );

    // update label preview
    $( document ).on( 'change', '.label-preview-option', function() {
        dymoRenderLabel();
        dymoPrintPreview();
    } );

    // update print button
    $( document ).on( 'change keyup', '.product-label-input', function() {
        var barcodes = 0,
            $printButton = $( '#wcb_print_btn' );

        $( '.product-label-input' ).each( function() {
            barcodes += Number( $( this ).val() );

            if ( wcb_params.dymo_printer ) {
                if ( barcodes > 0 ) {
                    $printButton.prop( 'disabled', false ).find( 'span' ).text( barcodes );
                } else {
                    $printButton.prop( 'disabled', true ).find( 'span' ).text( '' );
                }
            }
        } );
    } );

    // print
    $( document ).on( 'click', '#wcb_print_btn', function( e ) {
        e.preventDefault();
        labelSet = dymoCreateLabelSet();
        dymoPrintLabel( labelSet );
        return false;
    } );

} );
