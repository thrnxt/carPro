package kz.car.maintenance.repository.projection.admin;

public interface AdminLabeledCountView {
    String getLabel();

    String getSecondaryLabel();

    Long getCount();
}
