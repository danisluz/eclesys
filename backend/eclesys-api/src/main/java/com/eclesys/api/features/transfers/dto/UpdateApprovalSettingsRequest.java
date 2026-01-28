package com.eclesys.api.features.transfers.dto;

import com.eclesys.api.features.tenants.entity.ApprovalLevel;

public record UpdateApprovalSettingsRequest(
    ApprovalLevel internalSameSectorApproval,
    ApprovalLevel internalCrossSectorApproval,
    ApprovalLevel externalApproval,
    Boolean requireJustificationOnRejection,
    Boolean allowRequesterCancel
) {
}
